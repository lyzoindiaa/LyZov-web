const Brand = require("../models/Brand");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const getBrands = asyncHandler(async (req, res) => {
  const query = req.query.all === "true" ? {} : { isActive: true };
  const brands = await Brand.find(query).sort("name");
  return sendSuccess(res, 200, "Brands fetched successfully", brands);
});

const getBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ slug: req.params.slug, isActive: true });
  if (!brand) throw ApiError.notFound("Brand not found");
  return sendSuccess(res, 200, "Brand fetched successfully", brand);
});

const createBrand = asyncHandler(async (req, res) => {
  const trimmedName = req.body.name?.trim();
  if (!trimmedName) throw ApiError.badRequest("Brand name is required");

  const existing = await Brand.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
  });
  if (existing) {
    throw ApiError.badRequest(`Brand "${trimmedName}" already exists.`);
  }

  let logo = { url: "", publicId: "" };
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "novacart/brands");
    logo = { url: result.secure_url, publicId: result.public_id };
  }
  const brand = await Brand.create({ ...req.body, name: trimmedName, logo });
  return sendSuccess(res, 201, "Brand created successfully", brand);
});

const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw ApiError.notFound("Brand not found");

  if (req.body.name && req.body.name.trim() !== brand.name) {
    const trimmedName = req.body.name.trim();
    const existing = await Brand.findOne({
      _id: { $ne: brand._id },
      name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });
    if (existing) {
      throw ApiError.badRequest(`Another brand named "${trimmedName}" already exists.`);
    }
    brand.name = trimmedName;
  }

  if (req.file) {
    if (brand.logo?.publicId) await deleteFromCloudinary(brand.logo.publicId);
    const result = await uploadToCloudinary(req.file.buffer, "novacart/brands");
    brand.logo = { url: result.secure_url, publicId: result.public_id };
  }

  Object.keys(req.body).forEach((key) => {
    if (key !== "name") brand[key] = req.body[key];
  });
  await brand.save();

  return sendSuccess(res, 200, "Brand updated successfully", brand);
});

const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw ApiError.notFound("Brand not found");

  const productCount = await Product.countDocuments({ brand: brand._id });
  if (productCount > 0) {
    throw ApiError.badRequest(
      `Cannot delete brand "${brand.name}". It is currently assigned to ${productCount} product(s). Please reassign or remove those products first.`
    );
  }

  if (brand.logo?.publicId) await deleteFromCloudinary(brand.logo.publicId);
  await brand.deleteOne();

  return sendSuccess(res, 200, "Brand deleted successfully");
});

module.exports = { getBrands, getBrandBySlug, createBrand, updateBrand, deleteBrand };
