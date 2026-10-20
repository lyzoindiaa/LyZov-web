const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Address = require("../models/Address");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");
const { decrypt } = require("../utils/encryption");

/**
 * Generate a strong, readable temporary password
 * e.g. LyZov#8kX2!
 */
const generateTempPassword = () => {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LyZov#${randomPart}!`;
};

/**
 * Helper to build WhatsApp share text and deep link
 */
const buildWhatsAppInvite = ({ name, businessName, email, tempPassword, phone, loginUrl }) => {
  const url = loginUrl || process.env.CLIENT_URL || "https://lyzov.com/login";
  const business = businessName ? ` for "${businessName}"` : "";

  const text = `Hello ${name || "Partner"},\n\nWelcome to LyZov Gentlemen! Your Seller account${business} has been created.\n\nHere are your login credentials:\n🌐 Portal: ${url}\n📧 Email: ${email}\n🔑 Temporary Password: ${tempPassword}\n\nPlease log in and update your password in Profile > Security.`;

  // Clean phone number (strip spaces, dashes, parentheses)
  let cleanPhone = String(phone || "").replace(/[^0-9+]/g, "");
  if (cleanPhone.startsWith("+")) {
    cleanPhone = cleanPhone.substring(1);
  }
  // Default to India country code 91 if 10 digits
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return { text, whatsappUrl, cleanPhone };
};

// @desc    Get overall admin overview stats
// @route   GET /api/admin/overview
// @access  Private/Admin
const getAdminOverview = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    activeCustomers,
    totalSellers,
    activeSellers,
    inactiveSellers,
    pendingKycSellers,
    recentSellers,
    recentCustomers,
  ] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "customer", isActive: true }),
    User.countDocuments({ role: "seller" }),
    User.countDocuments({ role: "seller", isActive: true }),
    User.countDocuments({ role: "seller", isActive: false }),
    User.countDocuments({ role: "seller", "sellerProfile.kycStatus": { $in: ["pending", "submitted"] } }),
    User.find({ role: "seller" })
      .select("name email phone sellerProfile isActive createdAt lastLoginAt")
      .sort("-createdAt")
      .limit(6),
    User.find({ role: "customer" })
      .select("name email phone isActive profileComplete createdAt lastLoginAt")
      .sort("-createdAt")
      .limit(6),
  ]);

  return sendSuccess(res, 200, "Admin overview fetched successfully", {
    stats: {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalSellers,
      activeSellers,
      inactiveSellers,
      pendingKycSellers,
    },
    recentSellers: recentSellers.map((s) => s.toSafeObject()),
    recentCustomers: recentCustomers.map((c) => c.toSafeObject()),
  });
});

// @desc    Get all sellers with filtering & search
// @route   GET /api/admin/sellers
// @access  Private/Admin
const getSellers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const { search, status, kycStatus } = req.query;

  const filter = { role: "seller" };

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (kycStatus && ["pending", "submitted", "verified", "rejected"].includes(kycStatus)) {
    filter["sellerProfile.kycStatus"] = kycStatus;
  }

  if (search) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
      { "sellerProfile.businessName": { $regex: escaped, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);
  const sellers = await User.find(filter)
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return sendSuccess(
    res,
    200,
    "Sellers fetched successfully",
    sellers.map((s) => s.toSafeObject()),
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }
  );
});

// @desc    Get single seller details by ID (including decrypted KYC numbers for admin review)
// @route   GET /api/admin/sellers/:id
// @access  Private/Admin
const getSellerById = asyncHandler(async (req, res) => {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) {
    throw ApiError.notFound("Seller not found");
  }

  const safeSeller = seller.toSafeObject();

  // Explicitly ensure decrypted KYC fields are accessible for admin verification
  if (seller.sellerProfile?.panNumber) {
    try {
      safeSeller.sellerProfile.panNumber = decrypt(seller.sellerProfile.panNumber);
    } catch {
      safeSeller.sellerProfile.panNumber = seller.sellerProfile.panNumber;
    }
  }
  if (seller.sellerProfile?.aadhaarNumber) {
    try {
      safeSeller.sellerProfile.aadhaarNumber = decrypt(seller.sellerProfile.aadhaarNumber);
    } catch {
      safeSeller.sellerProfile.aadhaarNumber = seller.sellerProfile.aadhaarNumber;
    }
  }

  return sendSuccess(res, 200, "Seller details fetched successfully", { seller: safeSeller });
});

// @desc    Invite / Add a new seller (with random temp password, email invite, and WhatsApp link)
// @route   POST /api/admin/sellers
// @access  Private/Admin
const inviteSeller = asyncHandler(async (req, res) => {
  const { name, email, phone, businessName, storeBio, sendEmail = true } = req.body;

  if (!name || !name.trim()) throw ApiError.badRequest("Seller name is required");
  if (!email || !email.trim()) throw ApiError.badRequest("Seller email is required");

  const formattedEmail = email.trim().toLowerCase();
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(formattedEmail)) {
    throw ApiError.badRequest("Please provide a valid email address");
  }

  const existing = await User.findOne({ email: formattedEmail });
  if (existing) {
    throw ApiError.badRequest("An account with this email already exists");
  }

  const tempPassword =
    req.body.tempPassword && String(req.body.tempPassword).trim().length >= 8
      ? String(req.body.tempPassword).trim()
      : generateTempPassword();

  const newSeller = new User({
    name: name.trim(),
    email: formattedEmail,
    phone: phone ? phone.trim() : "",
    password: tempPassword,
    role: "seller",
    isActive: true,
    isEmailVerified: true, // Auto-verified when invited by admin
    sellerProfile: {
      businessName: businessName ? businessName.trim() : "",
      storeBio: storeBio ? storeBio.trim() : "",
      kycStatus: "pending",
    },
  });

  await newSeller.save();

  // Create empty Cart and Wishlist
  await Promise.all([
    Cart.create({ user: newSeller._id, items: [] }),
    Wishlist.create({ user: newSeller._id, products: [] }),
  ]);

  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const loginUrl = `${clientUrl}/login`;

  // Send invitation email if requested
  let emailStatus = "skipped";
  if (sendEmail) {
    try {
      const emailRes = await emailService.sendSellerInvitation({
        seller: newSeller,
        businessName: businessName ? businessName.trim() : "",
        temporaryPassword: tempPassword,
        loginUrl,
      });
      emailStatus = emailRes?.success ? "sent" : "failed";
    } catch (err) {
      console.error("[AdminController] Error sending invitation email:", err.message);
      emailStatus = "failed";
    }
  }

  // Generate WhatsApp message and direct link
  const { text: whatsappMessage, whatsappUrl } = buildWhatsAppInvite({
    name: newSeller.name,
    businessName: businessName ? businessName.trim() : "",
    email: formattedEmail,
    tempPassword,
    phone: newSeller.phone,
    loginUrl,
  });

  return sendSuccess(res, 201, "Seller created and invitation prepared successfully", {
    seller: newSeller.toSafeObject(),
    temporaryPassword: tempPassword,
    whatsappUrl,
    whatsappMessage,
    emailStatus,
  });
});

// @desc    Update seller details
// @route   PUT /api/admin/sellers/:id
// @access  Private/Admin
const updateSeller = asyncHandler(async (req, res) => {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw ApiError.notFound("Seller not found");

  const { name, email, phone, businessName, storeBio, gstNumber, businessAddress, bankDetails } = req.body;

  if (name && name.trim()) seller.name = name.trim();

  if (email && email.trim().toLowerCase() !== seller.email) {
    const formattedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: formattedEmail, _id: { $ne: seller._id } });
    if (existing) {
      throw ApiError.badRequest("This email is already associated with another account");
    }
    seller.email = formattedEmail;
  }

  if (phone !== undefined) seller.phone = phone.trim();

  if (!seller.sellerProfile) seller.sellerProfile = {};
  if (businessName !== undefined) seller.sellerProfile.businessName = businessName.trim();
  if (storeBio !== undefined) seller.sellerProfile.storeBio = storeBio.trim();
  if (gstNumber !== undefined) seller.sellerProfile.gstNumber = gstNumber.trim().toUpperCase();

  if (businessAddress) {
    seller.sellerProfile.businessAddress = {
      ...seller.sellerProfile.businessAddress,
      ...businessAddress,
    };
  }

  if (bankDetails) {
    seller.sellerProfile.bankDetails = {
      ...seller.sellerProfile.bankDetails,
      ...bankDetails,
    };
  }

  await seller.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Seller details updated successfully", {
    seller: seller.toSafeObject(),
  });
});

// @desc    Toggle seller active/deactivated status
// @route   PUT /api/admin/sellers/:id/status
// @access  Private/Admin
const updateSellerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    throw ApiError.badRequest("isActive boolean is required");
  }

  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw ApiError.notFound("Seller not found");

  seller.isActive = isActive;
  await seller.save({ validateBeforeSave: false });

  // If deactivated, revoke all existing sessions immediately
  if (!isActive) {
    await Session.revokeAllUserSessions(seller._id);
  }

  return sendSuccess(
    res,
    200,
    `Seller account has been ${isActive ? "activated" : "deactivated"} successfully`,
    { seller: seller.toSafeObject() }
  );
});

// @desc    Approve or reject seller KYC
// @route   PUT /api/admin/sellers/:id/kyc
// @access  Private/Admin
const updateSellerKyc = asyncHandler(async (req, res) => {
  const { kycStatus, kycRejectionReason } = req.body;

  if (!["pending", "submitted", "verified", "rejected"].includes(kycStatus)) {
    throw ApiError.badRequest("Invalid KYC status. Must be pending, submitted, verified, or rejected");
  }

  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw ApiError.notFound("Seller not found");

  if (!seller.sellerProfile) seller.sellerProfile = {};

  seller.sellerProfile.kycStatus = kycStatus;

  if (kycStatus === "verified") {
    seller.sellerProfile.kycVerifiedAt = new Date();
    seller.sellerProfile.kycRejectionReason = "";
  } else if (kycStatus === "rejected") {
    seller.sellerProfile.kycRejectionReason = kycRejectionReason || "Documents provided do not meet verification criteria.";
  }

  await seller.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, `Seller KYC status updated to ${kycStatus}`, {
    seller: seller.toSafeObject(),
  });
});

// @desc    Resend invitation credentials or reset temp password for seller
// @route   POST /api/admin/sellers/:id/resend-invite
// @access  Private/Admin
const resendSellerInvite = asyncHandler(async (req, res) => {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" }).select("+password");
  if (!seller) throw ApiError.notFound("Seller not found");

  const tempPassword = generateTempPassword();
  seller.password = tempPassword; // Will be hashed via pre-save hook
  await seller.save();

  const clientUrl = process.env.CLIENT_URL || "https://lyzov.com";
  const loginUrl = `${clientUrl}/login`;

  let emailStatus = "sent";
  try {
    await emailService.sendSellerInvitation({
      seller,
      businessName: seller.sellerProfile?.businessName,
      temporaryPassword: tempPassword,
      loginUrl,
    });
  } catch (err) {
    console.error("[AdminController] Resend invite email error:", err.message);
    emailStatus = "failed";
  }

  const { text: whatsappMessage, whatsappUrl } = buildWhatsAppInvite({
    name: seller.name,
    businessName: seller.sellerProfile?.businessName,
    email: seller.email,
    tempPassword,
    phone: seller.phone,
    loginUrl,
  });

  return sendSuccess(res, 200, "Seller credentials reset and invitation regenerated", {
    temporaryPassword: tempPassword,
    whatsappUrl,
    whatsappMessage,
    emailStatus,
  });
});

// @desc    Get all customers with filtering & search
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const { search, status } = req.query;

  const filter = { role: "customer" };

  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;

  if (search) {
    const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
      { phone: { $regex: escaped, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);
  const customers = await User.find(filter)
    .populate("addresses")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return sendSuccess(
    res,
    200,
    "Customers fetched successfully",
    customers.map((c) => c.toSafeObject()),
    {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    }
  );
});

// @desc    Toggle customer active/deactivated status
// @route   PUT /api/admin/customers/:id/status
// @access  Private/Admin
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    throw ApiError.badRequest("isActive boolean is required");
  }

  const customer = await User.findOne({ _id: req.params.id, role: "customer" });
  if (!customer) throw ApiError.notFound("Customer not found");

  customer.isActive = isActive;
  await customer.save({ validateBeforeSave: false });

  if (!isActive) {
    await Session.revokeAllUserSessions(customer._id);
  }

  return sendSuccess(
    res,
    200,
    `Customer account has been ${isActive ? "activated" : "deactivated"} successfully`,
    { customer: customer.toSafeObject() }
  );
});

module.exports = {
  getAdminOverview,
  getSellers,
  getSellerById,
  inviteSeller,
  updateSeller,
  updateSellerStatus,
  updateSellerKyc,
  resendSellerInvite,
  getCustomers,
  updateCustomerStatus,
};
