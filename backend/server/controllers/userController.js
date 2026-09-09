const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");
const { encrypt, decrypt } = require("../utils/encryption");

// @desc    Update own profile (Customer/Common)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findById(req.user._id).populate("addresses");
  if (!user) throw ApiError.notFound("User not found");

  if (name && name.trim()) {
    user.name = name.trim();
  }

  if (email && email.trim().toLowerCase() !== user.email) {
    const formattedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formattedEmail)) {
      throw ApiError.badRequest("Please provide a valid email address");
    }
    const existing = await User.findOne({ email: formattedEmail, _id: { $ne: user._id } });
    if (existing) {
      throw ApiError.badRequest("This email is already associated with another account");
    }
    user.email = formattedEmail;
    user.isEmailVerified = false;
  }

  if (phone !== undefined) {
    const trimmedPhone = phone.trim();
    if (trimmedPhone !== user.phone) {
      user.phone = trimmedPhone;
      user.isPhoneVerified = false;
    }
  }

  if (req.file) {
    if (user.avatar?.publicId) await deleteFromCloudinary(user.avatar.publicId);
    const result = await uploadToCloudinary(req.file.buffer, "lyzov/avatars");
    user.avatar = { url: result.secure_url, publicId: result.public_id };
  }

  // Check if profile is now complete (phone + at least one address)
  if (user.phone && user.phone.trim() && user.addresses && user.addresses.length > 0) {
    user.profileComplete = true;
  }

  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Profile updated successfully", { 
    user: user.toSafeObject(),
    profileComplete: user.profileComplete,
  });
});

// @desc    Update seller business & KYC profile
// @route   PUT /api/users/seller/profile
// @access  Private (Seller/Admin)
const updateSellerProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found");

  const {
    name,
    email,
    phone,
    businessName,
    storeBio,
    panNumber,
    aadhaarNumber,
    gstNumber,
    businessAddress,
    bankDetails,
  } = req.body;

  if (name && name.trim()) user.name = name.trim();

  if (email && email.trim().toLowerCase() !== user.email) {
    const formattedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formattedEmail)) {
      throw ApiError.badRequest("Please provide a valid email address");
    }
    const existing = await User.findOne({ email: formattedEmail, _id: { $ne: user._id } });
    if (existing) {
      throw ApiError.badRequest("This email is already associated with another account");
    }
    user.email = formattedEmail;
    user.isEmailVerified = false;
  }

  if (phone !== undefined) {
    const trimmedPhone = phone.trim();
    if (trimmedPhone !== user.phone) {
      user.phone = trimmedPhone;
      user.isPhoneVerified = false;
    }
  }

  if (!user.sellerProfile) {
    user.sellerProfile = {};
  }

  if (businessName !== undefined) user.sellerProfile.businessName = businessName.trim();
  if (storeBio !== undefined) user.sellerProfile.storeBio = storeBio.trim();

  let hasKycUpdate = false;

  if (panNumber !== undefined) {
    const formattedPan = panNumber.trim().toUpperCase();
    if (formattedPan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formattedPan)) {
      throw ApiError.badRequest("Invalid PAN format (e.g. ABCDE1234F)");
    }
    const existingDecryptedPan = user.sellerProfile.panNumber ? decrypt(user.sellerProfile.panNumber) : "";
    if (formattedPan && formattedPan !== existingDecryptedPan) {
      user.sellerProfile.panNumber = encrypt(formattedPan);
      hasKycUpdate = true;
    } else if (!formattedPan) {
      user.sellerProfile.panNumber = "";
    }
  }

  if (aadhaarNumber !== undefined) {
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, "").trim();
    if (cleanAadhaar && !/^\d{12}$/.test(cleanAadhaar)) {
      throw ApiError.badRequest("Aadhaar number must be exactly 12 digits");
    }
    const existingDecryptedAadhaar = user.sellerProfile.aadhaarNumber ? decrypt(user.sellerProfile.aadhaarNumber) : "";
    if (cleanAadhaar && cleanAadhaar !== existingDecryptedAadhaar) {
      user.sellerProfile.aadhaarNumber = encrypt(cleanAadhaar);
      hasKycUpdate = true;
    } else if (!cleanAadhaar) {
      user.sellerProfile.aadhaarNumber = "";
    }
  }

  if (gstNumber !== undefined) {
    const formattedGst = gstNumber.trim().toUpperCase();
    if (formattedGst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formattedGst)) {
      throw ApiError.badRequest("Invalid GSTIN format (15 characters)");
    }
    user.sellerProfile.gstNumber = formattedGst;
  }

  if (businessAddress) {
    const addr = typeof businessAddress === "string" ? JSON.parse(businessAddress) : businessAddress;
    user.sellerProfile.businessAddress = {
      addressLine1: addr.addressLine1 !== undefined ? addr.addressLine1 : (user.sellerProfile.businessAddress?.addressLine1 || ""),
      addressLine2: addr.addressLine2 !== undefined ? addr.addressLine2 : (user.sellerProfile.businessAddress?.addressLine2 || ""),
      city: addr.city !== undefined ? addr.city : (user.sellerProfile.businessAddress?.city || ""),
      state: addr.state !== undefined ? addr.state : (user.sellerProfile.businessAddress?.state || ""),
      postalCode: addr.postalCode !== undefined ? addr.postalCode : (user.sellerProfile.businessAddress?.postalCode || ""),
      country: addr.country !== undefined ? addr.country : (user.sellerProfile.businessAddress?.country || "India"),
    };
  }

  if (bankDetails) {
    const bank = typeof bankDetails === "string" ? JSON.parse(bankDetails) : bankDetails;
    user.sellerProfile.bankDetails = {
      accountHolderName: bank.accountHolderName !== undefined ? bank.accountHolderName : (user.sellerProfile.bankDetails?.accountHolderName || ""),
      accountNumber: bank.accountNumber !== undefined ? bank.accountNumber : (user.sellerProfile.bankDetails?.accountNumber || ""),
      ifscCode: (bank.ifscCode !== undefined ? bank.ifscCode : (user.sellerProfile.bankDetails?.ifscCode || "")).toUpperCase(),
      bankName: bank.bankName !== undefined ? bank.bankName : (user.sellerProfile.bankDetails?.bankName || ""),
    };
  }

  // Handle uploaded files
  if (req.files) {
    if (req.files.avatar?.[0]) {
      if (user.avatar?.publicId) await deleteFromCloudinary(user.avatar.publicId);
      const resImg = await uploadToCloudinary(req.files.avatar[0].buffer, "lyzov/avatars");
      user.avatar = { url: resImg.secure_url, publicId: resImg.public_id };
    }

    if (req.files.panDocument?.[0]) {
      if (user.sellerProfile.panDocument?.publicId) await deleteFromCloudinary(user.sellerProfile.panDocument.publicId);
      const resPan = await uploadToCloudinary(req.files.panDocument[0].buffer, "lyzov/kyc");
      user.sellerProfile.panDocument = { url: resPan.secure_url, publicId: resPan.public_id };
      hasKycUpdate = true;
    }

    if (req.files.aadhaarDocument?.[0]) {
      if (user.sellerProfile.aadhaarDocument?.publicId) await deleteFromCloudinary(user.sellerProfile.aadhaarDocument.publicId);
      const resAadhaar = await uploadToCloudinary(req.files.aadhaarDocument[0].buffer, "lyzov/kyc");
      user.sellerProfile.aadhaarDocument = { url: resAadhaar.secure_url, publicId: resAadhaar.public_id };
      hasKycUpdate = true;
    }
  }

  if (hasKycUpdate && ["pending", "rejected"].includes(user.sellerProfile.kycStatus)) {
    user.sellerProfile.kycStatus = "submitted";
    user.sellerProfile.kycSubmittedAt = new Date();
  }

  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Seller profile updated successfully", { user: user.toSafeObject() });
});

// @desc    Delete seller KYC document
// @route   DELETE /api/users/seller/document/:docType
// @access  Private (Seller/Admin)
const deleteSellerDocument = asyncHandler(async (req, res) => {
  const { docType } = req.params; // "pan" or "aadhaar"
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found");

  if (!user.sellerProfile) {
    user.sellerProfile = {};
  }

  if (docType === "pan") {
    if (user.sellerProfile.panDocument?.publicId) {
      await deleteFromCloudinary(user.sellerProfile.panDocument.publicId);
    }
    user.sellerProfile.panDocument = { url: "", publicId: "" };
  } else if (docType === "aadhaar") {
    if (user.sellerProfile.aadhaarDocument?.publicId) {
      await deleteFromCloudinary(user.sellerProfile.aadhaarDocument.publicId);
    }
    user.sellerProfile.aadhaarDocument = { url: "", publicId: "" };
  } else {
    throw ApiError.badRequest("Invalid document type. Must be 'pan' or 'aadhaar'");
  }

  if (["submitted", "verified"].includes(user.sellerProfile.kycStatus)) {
    user.sellerProfile.kycStatus = "pending";
  }

  await user.save({ validateBeforeSave: false });
  return sendSuccess(res, 200, "Document removed successfully", { user: user.toSafeObject() });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  return sendSuccess(res, 200, "Password changed successfully. Please log in again.");
});

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(filter);

  return sendSuccess(
    res,
    200,
    "Users fetched successfully",
    users.map((u) => u.toSafeObject()),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
});

// @desc    Update user role / status (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "User updated successfully", { user: user.toSafeObject() });
});

// @desc    Delete a user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  await user.deleteOne();

  return sendSuccess(res, 200, "User deleted successfully");
});

module.exports = {
  updateProfile,
  updateSellerProfile,
  deleteSellerDocument,
  changePassword,
  getUsers,
  updateUser,
  deleteUser,
};
