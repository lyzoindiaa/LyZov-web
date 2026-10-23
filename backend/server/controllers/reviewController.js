const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadToCloudinary } = require("../config/cloudinary");

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

  const total = await Review.countDocuments({ product: productId, isApproved: true });

  // Calculate rating breakdown distribution
  let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let averageRating = 0;

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

  return sendSuccess(res, 200, "Reviews fetched successfully", reviews, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    distribution,
    averageRating,
  });
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) throw ApiError.conflict("You have already reviewed this product");

  const hasPurchased = await Order.findOne({
    user: req.user._id,
    "items.product": productId,
    $or: [
      { isPaid: true },
      { orderStatus: "delivered" },
      { paymentStatus: "captured" },
    ],
  });

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
    isVerifiedPurchase: !!hasPurchased,
    order: hasPurchased?._id || null,
  });

  return sendSuccess(res, 201, "Review submitted successfully", review);
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

  return sendSuccess(res, 200, "Review updated successfully", review);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== "seller" && req.user.role !== "admin") {
    throw ApiError.forbidden("You do not have permission to delete this review");
  }

  await Review.findOneAndDelete({ _id: req.params.id });

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

  return sendSuccess(res, 200, "Marked as helpful", review);
});

module.exports = { getProductReviews, createReview, updateReview, deleteReview, markHelpful };
