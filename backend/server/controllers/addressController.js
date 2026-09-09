const Address = require("../models/Address");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort("-isDefault -createdAt");
  return sendSuccess(res, 200, "Addresses fetched successfully", addresses);
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await Address.create({ ...req.body, user: req.user._id });
  
  // Mark profile as complete if user has phone + now has an address
  const user = await User.findById(req.user._id);
  if (user && user.phone && user.phone.trim()) {
    user.profileComplete = true;
    await user.save({ validateBeforeSave: false });
  }
  
  return sendSuccess(res, 201, "Address added successfully", { 
    address,
    profileComplete: user?.profileComplete || false,
  });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound("Address not found");

  Object.keys(req.body).forEach((key) => (address[key] = req.body[key]));
  await address.save();

  return sendSuccess(res, 200, "Address updated successfully", address);
});

const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound("Address not found");

  return sendSuccess(res, 200, "Address deleted successfully");
});

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress };
