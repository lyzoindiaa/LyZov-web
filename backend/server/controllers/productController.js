const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const ApiFeatures = require("../utils/apiFeatures");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const slugify = require("slugify");
const { parseSearchKeywords } = require("../utils/searchKeywords");

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const generateNextLyId = async () => {
  const latestProduct = await Product.findOne({ lyId: /^LYZOV-\d+$/ })
    .sort({ lyId: -1 })
    .select("lyId")
    .lean();
  const latestNumber = latestProduct ? Number(latestProduct.lyId.replace("LYZOV-", "")) : 0;
  return `LYZOV-${String(latestNumber + 1).padStart(6, "0")}`;
};

// Allows the "category"/"brand" query params to be either a real Mongo ObjectId
// (used by the Shop page filters) or a human-readable slug (used by Navbar links
// like /shop?category=men) — resolves slugs to their ObjectId before filtering.
const resolveSlugFilters = async (query) => {
  const resolved = { ...query };

  if (resolved.category && !isValidObjectId(resolved.category)) {
    const rawCat = String(resolved.category).trim();
    const escaped = rawCat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const categoryDoc = await Category.findOne({
      $or: [
        { slug: rawCat.toLowerCase() },
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    });
    resolved.category = categoryDoc ? categoryDoc._id.toString() : new mongoose.Types.ObjectId().toString();
  }

  if (resolved.brand && !isValidObjectId(resolved.brand)) {
    const rawBrand = String(resolved.brand).trim();
    const escaped = rawBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const brandDoc = await Brand.findOne({
      $or: [
        { slug: rawBrand.toLowerCase() },
        { name: { $regex: new RegExp(`^${escaped}$`, "i") } },
      ],
    });
    resolved.brand = brandDoc ? brandDoc._id.toString() : new mongoose.Types.ObjectId().toString();
  }

  return resolved;
};

// @desc    Get all products with filter/sort/search/pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const resolvedQuery = await resolveSlugFilters(req.query);

  delete resolvedQuery.__p;
  delete resolvedQuery.path;
  delete resolvedQuery["path*"];
  const activeFilter = resolvedQuery.includeInactive === "true" ? {} : { isActive: { $ne: false } };
  delete resolvedQuery.includeInactive;

  if (resolvedQuery.seller) {
    activeFilter.seller = resolvedQuery.seller;
    delete resolvedQuery.seller;
  }
  if (resolvedQuery.moderationStatus) {
    activeFilter.moderationStatus = resolvedQuery.moderationStatus;
    delete resolvedQuery.moderationStatus;
  } else if (!resolvedQuery.includeUnmoderated) {
    activeFilter.moderationStatus = { $ne: "rejected" };
  }
  delete resolvedQuery.includeUnmoderated;

  const baseQuery = Product.find(activeFilter)
    .populate("brand", "name slug")
    .populate("category", "name slug level ancestors parent")
    .populate("categoryPath", "name slug level")
    .populate("seller", "name sellerProfile.businessName sellerProfile.storeSlug sellerProfile.kycStatus");

  const features = new ApiFeatures(baseQuery, resolvedQuery).search().filter().sort().limitFields().paginate();

  const products = await features.query;

  const countFeatures = new ApiFeatures(Product.find(activeFilter), resolvedQuery).search().filter();
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

  let product = await Product.findOne({ ...identifierQuery, isActive: { $ne: false } })
    .populate("brand", "name slug logo")
    .populate("category", "name slug level ancestors parent")
    .populate("categoryPath", "name slug level")
    .populate("seller", "name email phone sellerProfile.businessName sellerProfile.storeSlug sellerProfile.storeBio sellerProfile.kycStatus");

  if (!product) {
    // Check slugHistory for permanent 301 relocation
    const historicalProduct = await Product.findOne({
      slugHistory: productIdentifier.toLowerCase(),
      isActive: { $ne: false },
    })
      .populate("brand", "name slug logo")
      .populate("category", "name slug level ancestors parent")
      .populate("categoryPath", "name slug level");

    if (historicalProduct) {
      const relatedProducts = await Product.find({
        categoryPath: historicalProduct.category,
        _id: { $ne: historicalProduct._id },
        isActive: { $ne: false },
      })
        .limit(8)
        .select("title slug price discountPrice images ratingsAverage");

      return sendSuccess(res, 200, "Product relocated (301)", {
        product: historicalProduct,
        relatedProducts,
        isRedirect: true,
        canonicalSlug: historicalProduct.slug,
        redirectUrl: `/product/${historicalProduct.slug}`,
      });
    }

    throw ApiError.notFound("Product not found");
  }

  const categoryId = product.category?._id || product.category;
  const relatedProducts = await Product.find({
    $or: [{ categoryPath: categoryId }, { category: categoryId }],
    _id: { $ne: product._id },
    isActive: { $ne: false },
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
  const products = await Product.find({ ...filter, isActive: { $ne: false } })
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

  const cleanTitle = (req.body.title || "").trim();
  const cleanDesc = (req.body.description || "").replace(/<[^>]*>?/gm, "").trim();
  const cleanShortDesc = (req.body.shortDescription || "").replace(/<[^>]*>?/gm, "").trim();

  // Automatic SEO generation with optional seller override
  const metaTitle = req.body.metaTitle?.trim() || (cleanTitle ? `${cleanTitle} | Buy Online at LyZov` : "");
  const fallbackSnippet = cleanShortDesc || cleanDesc.slice(0, 150);
  const metaDescription =
    req.body.metaDescription?.trim() ||
    (fallbackSnippet ? `${fallbackSnippet} — Shop genuine products with Pan-India delivery on LyZov.` : "");

  const requestedLyId = req.body.lyId?.trim();
  const { searchKeyword: normalizedKeywords, tags: keywordTags } = parseSearchKeywords(req.body.searchKeyword);

  const productData = {
    ...req.body,
    seller: req.user?.role === "admin" && req.body.seller ? req.body.seller : req.user?._id,
    moderationStatus: req.body.moderationStatus || "approved",
    mpn: req.body.mpn?.trim() || "",
    searchKeyword: normalizedKeywords,
    tags: keywordTags,
    seo: {
      metaTitle,
      metaDescription,
      canonicalUrl: req.body.canonicalUrl?.trim() || "",
    },
    lyId: requestedLyId || (await generateNextLyId()),
    categoryPath,
    images: uploadedImages,
  };

  // If custom slug was provided by seller, format and check uniqueness
  if (req.body.slug?.trim()) {
    const customSlug = slugify(req.body.slug.trim(), { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    if (customSlug) {
      const existingSlug = await Product.findOne({ slug: customSlug });
      if (!existingSlug) {
        productData.slug = customSlug;
      }
    }
  }

  let product;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      product = await Product.create(productData);
      break;
    } catch (error) {
      if (error.code !== 11000 || requestedLyId) throw error;
      productData.lyId = await generateNextLyId();
    }
  }

  if (!product) throw ApiError.conflict("Could not generate a unique LY ID. Please try again.");

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

  // Enforce tenancy / ownership
  if (
    product.seller &&
    req.user.role === "seller" &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden("You do not have permission to modify another seller's product.");
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

  // Safe slug update with 301 history logging
  if (req.body.slug && req.body.slug.trim() && req.body.slug.trim() !== product.slug) {
    const targetSlug = slugify(req.body.slug.trim(), { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    if (targetSlug && targetSlug !== product.slug) {
      const existingWithSlug = await Product.findOne({ slug: targetSlug, _id: { $ne: product._id } });
      if (existingWithSlug) {
        throw ApiError.badRequest(`Slug '${targetSlug}' is already taken by another product.`);
      }
      if (product.slug && !product.slugHistory.includes(product.slug)) {
        product.slugHistory.push(product.slug);
      }
      product.slug = targetSlug;
    }
  }

  if (req.body.mpn !== undefined) {
    product.mpn = req.body.mpn.trim();
  }

  if (req.body.searchKeyword !== undefined) {
    const { searchKeyword: normalizedKeywords, tags: keywordTags } = parseSearchKeywords(req.body.searchKeyword);
    product.searchKeyword = normalizedKeywords;
    product.tags = keywordTags;
  }

  // Handle SEO updates
  if (!product.seo) product.seo = {};
  if (req.body.metaTitle !== undefined) product.seo.metaTitle = req.body.metaTitle.trim();
  if (req.body.metaDescription !== undefined) product.seo.metaDescription = req.body.metaDescription.trim();
  if (req.body.canonicalUrl !== undefined) product.seo.canonicalUrl = req.body.canonicalUrl.trim();

  // If title was updated but metaTitle is blank, refresh default metaTitle
  if (req.body.title && !product.seo.metaTitle) {
    product.seo.metaTitle = `${req.body.title.trim()} | Buy Online at LyZov`;
  }

  const allowedFields = [
    "title", "description", "shortDescription", "specialFeature", "color",
    "productSizeHeight", "productSizeLength", "productSizeWidth", "weight",
    "packagingSizeHeight", "packagingSizeLength", "packagingSizeWidth", "packOf",
    "warranty", "country", "manufacturer", "packer", "hsnNumber", "gstRate",
    "brand", "category", "subCategory", "material", "careInstructions",
    "price", "compareAtPrice", "costPrice", "sku", "barcode", "inventory",
    "variants", "isFeatured", "isActive", "status"
  ];

  allowedFields.forEach((key) => {
    if (req.body[key] !== undefined) {
      product[key] = req.body[key];
    }
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

  if (
    product.seller &&
    req.user.role === "seller" &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden("You do not have permission to modify another seller's product.");
  }

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

  if (
    product.seller &&
    req.user.role === "seller" &&
    product.seller.toString() !== req.user._id.toString()
  ) {
    throw ApiError.forbidden("You do not have permission to delete another seller's product.");
  }

  for (const image of product.images) {
    await deleteFromCloudinary(image.publicId);
  }

  await product.deleteOne();

  return sendSuccess(res, 200, "Product deleted successfully");
});

// @desc    Get public seller store profile and their active products
// @route   GET /api/products/store/:storeSlug
// @access  Public
const getSellerStorefront = asyncHandler(async (req, res) => {
  const { storeSlug } = req.params;
  const seller = await User.findOne({
    role: "seller",
    isActive: true,
    "sellerProfile.storeSlug": storeSlug.toLowerCase().trim(),
  }).select("name email createdAt sellerProfile.businessName sellerProfile.storeSlug sellerProfile.storeBio sellerProfile.kycStatus");

  if (!seller) {
    throw ApiError.notFound("Seller store not found or is currently inactive.");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const filter = {
    seller: seller._id,
    isActive: true,
    moderationStatus: "approved",
  };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return sendSuccess(res, 200, "Seller store fetched successfully", {
    seller: {
      id: seller._id,
      name: seller.name,
      businessName: seller.sellerProfile?.businessName || seller.name,
      storeSlug: seller.sellerProfile?.storeSlug,
      storeBio: seller.sellerProfile?.storeBio || "",
      kycVerified: seller.sellerProfile?.kycStatus === "verified",
      memberSince: seller.createdAt,
    },
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductCollection,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  getSellerStorefront,
};