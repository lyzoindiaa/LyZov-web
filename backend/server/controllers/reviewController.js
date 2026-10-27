const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadToCloudinary } = require("../config/cloudinary");
const reviewStreamManager = require("../utils/reviewStreamManager");

// Helper to compute 5-star rating breakdown distribution & average
const calculateReviewStats = async (productId) => {
  let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let averageRating = 0;
  const total = await Review.countDocuments({ product: productId, isApproved: true });

  if (mongoose.isValidObjectId(productId)) {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    let totalRatingSum = 0;
    stats.forEach((s) => {
      if (distribution[s._id] !== undefined) {
        distribution[s._id] = s.count;
        totalRatingSum += s._id * s.count;
      }
    });

    averageRating = total > 0 ? Number((totalRatingSum / total).toFixed(1)) : 0;
  }

  return { distribution, averageRating, total };
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const productId = req.params.productId;

  const reviews = await Review.find({ product: productId, isApproved: true })
    .populate("user", "name avatar")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const { distribution, averageRating, total } = await calculateReviewStats(productId);

  return sendSuccess(res, 200, "Reviews fetched successfully", reviews, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    distribution,
    averageRating,
  });
});

// @desc    Real-time SSE stream for product reviews
// @route   GET /api/reviews/product/:productId/stream
// @access  Public
const streamProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  reviewStreamManager.addClient(productId, req, res);
});

// @desc    Check review eligibility for authenticated user
// @route   GET /api/reviews/product/:productId/eligibility
// @access  Private
const checkReviewEligibility = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const existingReview = await Review.findOne({ product: productId, user: req.user._id });

  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "items.product": productId,
    $or: [
      { isPaid: true },
      { orderStatus: "delivered" },
      { paymentStatus: "captured" },
    ],
  });

  return sendSuccess(res, 200, "Review eligibility checked", {
    canReview: Boolean(hasPurchased && !existingReview),
    hasPurchased: Boolean(hasPurchased),
    alreadyReviewed: Boolean(existingReview),
    reviewId: existingReview?._id || null,
    orderId: hasPurchased?._id || null,
  });
});

// @desc    Create a review (Restricted strictly to verified buyers)
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw ApiError.conflict("You have already reviewed this product");

  // Strict Buyer Verification: Must have paid or delivered order containing this product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "items.product": productId,
    $or: [
      { isPaid: true },
      { orderStatus: "delivered" },
      { paymentStatus: "captured" },
    ],
  });

  if (!hasPurchased) {
    throw ApiError.forbidden(
      "Review submission is restricted to verified customers who have purchased this product."
    );
  }

  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "novacart/reviews");
      images.push({ url: result.secure_url, publicId: result.public_id });
    }
  }

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating: Number(rating),
    title: title || "",
    comment,
    images,
    isVerifiedPurchase: true,
    order: hasPurchased._id,
  });

  const populatedReview = await Review.findById(review._id).populate("user", "name avatar");
  const stats = await calculateReviewStats(productId);

  // Broadcast real-time review event to all shoppers currently viewing this product
  reviewStreamManager.broadcastToProduct(productId, "review:new", {
    review: populatedReview,
    distribution: stats.distribution,
    averageRating: stats.averageRating,
    total: stats.total,
  });

  return sendSuccess(res, 201, "Review submitted successfully", populatedReview);
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  if (review.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only edit your own review");
  }

  const { rating, title, comment } = req.body;
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment;

  await review.save();
  const populated = await Review.findById(review._id).populate("user", "name avatar");
  const stats = await calculateReviewStats(review.product);

  // Broadcast real-time update
  reviewStreamManager.broadcastToProduct(review.product, "review:updated", {
    review: populated,
    distribution: stats.distribution,
    averageRating: stats.averageRating,
    total: stats.total,
  });

  return sendSuccess(res, 200, "Review updated successfully", populated);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  let isProductSeller = false;

  if (req.user.role === "seller") {
    const product = await Product.findById(review.product);
    if (product && product.seller && product.seller.toString() === req.user._id.toString()) {
      isProductSeller = true;
    }
  }

  if (!isOwner && !isAdmin && !isProductSeller) {
    throw ApiError.forbidden("You do not have permission to delete this review");
  }

  const productId = review.product;
  await Review.findOneAndDelete({ _id: req.params.id });

  const stats = await calculateReviewStats(productId);

  // Broadcast real-time deletion
  reviewStreamManager.broadcastToProduct(productId, "review:deleted", {
    reviewId: req.params.id,
    distribution: stats.distribution,
    averageRating: stats.averageRating,
    total: stats.total,
  });

  return sendSuccess(res, 200, "Review deleted successfully");
});

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpfulCount: 1 } },
    { new: true }
  );
  if (!review) throw ApiError.notFound("Review not found");

  // Broadcast real-time helpful count update
  reviewStreamManager.broadcastToProduct(review.product, "review:helpful", {
    reviewId: review._id,
    helpfulCount: review.helpfulCount,
  });

  return sendSuccess(res, 200, "Marked as helpful", review);
});

module.exports = {
  getProductReviews,
  streamProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
};
