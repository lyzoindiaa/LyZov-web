const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const ApiFeatures = require("../utils/apiFeatures");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Allows the "category"/"brand" query params to be either a real Mongo ObjectId
// (used by the Shop page filters) or a human-readable slug (used by Navbar links
// like /shop?category=men) — resolves slugs to their ObjectId before filtering.
const resolveSlugFilters = async (query) => {
  const resolved = { ...query };

  if (resolved.category && !isValidObjectId(resolved.category)) {
    const categoryDoc = await Category.findOne({ slug: resolved.category.toLowerCase() });
    resolved.category = categoryDoc ? categoryDoc._id.toString() : "___no_match___";
  }

  if (resolved.brand && !isValidObjectId(resolved.brand)) {
    const brandDoc = await Brand.findOne({ slug: resolved.brand.toLowerCase() });
    resolved.brand = brandDoc ? brandDoc._id.toString() : "___no_match___";
  }

  return resolved;
};

// @desc    Get all products with filter/sort/search/pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const resolvedQuery = await resolveSlugFilters(req.query);

  const baseQuery = Product.find({ isActive: true })
    .populate("brand", "name slug")
    .populate("category", "name slug level ancestors parent")
    .populate("categoryPath", "name slug level");

  const features = new ApiFeatures(baseQuery, resolvedQuery).search().filter().sort().limitFields().paginate();

  const products = await features.query;

  const countFeatures = new ApiFeatures(Product.find({ isActive: true }), resolvedQuery).search().filter();
  const total = await countFeatures.query.clone().countDocuments();

  return sendSuccess(res, 200, "Products fetched successfully", products, {
    page: features.pagination.page,
    limit: features.pagination.limit,
    total,
    totalPages: Math.ceil(total / features.pagination.limit),
  });
});

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  const productIdentifier = req.params.slug;
  const identifierQuery = isValidObjectId(productIdentifier)
    ? { $or: [{ slug: productIdentifier }, { _id: productIdentifier }] }
    : { slug: productIdentifier };

  const product = await Product.findOne({ ...identifierQuery, isActive: true })
    .populate("brand", "name slug logo")
    .populate("category", "name slug level ancestors parent")
    .populate("categoryPath", "name slug level");

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const relatedProducts = await Product.find({
    categoryPath: product.category,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(8)
    .select("title slug price discountPrice images ratingsAverage");

  return sendSuccess(res, 200, "Product fetched successfully", { product, relatedProducts });
});

// @desc    Get featured / trending / new-arrival products
// @route   GET /api/products/collections/:type
// @access  Public
const getProductCollection = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const filterMap = {
    featured: { isFeatured: true },
    trending: { isTrending: true },
    "new-arrivals": { isNewArrival: true },
  };

  const filter = filterMap[type];
  if (!filter) {
    throw ApiError.badRequest("Invalid collection type");
  }

  const limit = Number(req.query.limit) || 12;
  const products = await Product.find({ ...filter, isActive: true })
    .limit(limit)
    .populate("brand", "name slug")
    .populate("category", "name slug");

  return sendSuccess(res, 200, `${type} products fetched`, products);
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const uploadedImages = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "novacart/products");
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id, altText: req.body.title });
    }
  }

  let categoryPath = [];
  if (req.body.category) {
    const categoryDoc = await Category.findById(req.body.category);
    if (categoryDoc) {
      categoryPath = [
        ...(categoryDoc.ancestors || []).map((a) => a._id),
        categoryDoc._id,
      ];
    } else {
      categoryPath = [req.body.category];
    }
  }

  const product = await Product.create({ ...req.body, categoryPath, images: uploadedImages });

  return sendSuccess(res, 201, "Product created successfully", product);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const uploadedImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, "novacart/products");
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id, altText: req.body.title || product.title });
    }
  }

  if (req.body.imageOrder) {
    let imageOrder;
    try {
      imageOrder = JSON.parse(req.body.imageOrder);
    } catch {
      throw ApiError.badRequest("Invalid image order");
    }

    const existingImages = new Map(product.images.map((image) => [image._id.toString(), image]));
    let uploadedIndex = 0;
    const orderedImages = imageOrder
      .map((item) => item.isNew ? uploadedImages[uploadedIndex++] : existingImages.get(item.existingImageId))
      .filter(Boolean);
    const retainedIds = new Set(orderedImages.map((image) => image._id?.toString()).filter(Boolean));
    const removedImages = product.images.filter((image) => !retainedIds.has(image._id.toString()));
    await Promise.all(removedImages.map((image) => deleteFromCloudinary(image.publicId)));
    product.images = orderedImages;
  } else if (uploadedImages.length > 0) {
    product.images.push(...uploadedImages);
  }

  if (req.body.category && req.body.category.toString() !== product.category?.toString()) {
    const categoryDoc = await Category.findById(req.body.category);
    if (categoryDoc) {
      product.categoryPath = [
        ...(categoryDoc.ancestors || []).map((a) => a._id),
        categoryDoc._id,
      ];
    } else {
      product.categoryPath = [req.body.category];
    }
  }

  Object.keys(req.body).forEach((key) => {
    if (key !== "images") product[key] = req.body[key];
  });

  await product.save();

  return sendSuccess(res, 200, "Product updated successfully", product);
});

// @desc    Delete a product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private/Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound("Product not found");

  const image = product.images.id(req.params.imageId);
  if (!image) throw ApiError.notFound("Image not found");

  await deleteFromCloudinary(image.publicId);
  product.images.pull(req.params.imageId);
  await product.save();

  return sendSuccess(res, 200, "Image removed successfully", product);
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  for (const image of product.images) {
    await deleteFromCloudinary(image.publicId);
  }

  await product.deleteOne();

  return sendSuccess(res, 200, "Product deleted successfully");
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductCollection,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
};