const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Address = require("../models/Address");
const Product = require("../models/Product");
const Payout = require("../models/Payout");
const SubOrder = require("../models/SubOrder");
const CommissionRule = require("../models/CommissionRule");
const {
  getMonthlySettlementBatch,
  releaseMonthlySettlementBatch,
  generateBankNeftCsv,
  promoteMaturedCoolingOffPayouts,
} = require("../services/settlementService");
const { generateSignedKycUrl } = require("../services/kycDocumentService");
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

  const filter = { role: "seller", isDeleted: { $ne: true } };

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

  const safeSeller = seller.toSafeObject({ revealKyc: true });

  // Attach signed URLs for admin KYC review if documents are uploaded
  if (seller.sellerProfile?.panDocument?.publicId) {
    safeSeller.sellerProfile.panDocument.signedUrl = generateSignedKycUrl(
      seller.sellerProfile.panDocument.publicId
    );
  }
  if (seller.sellerProfile?.aadhaarDocument?.publicId) {
    safeSeller.sellerProfile.aadhaarDocument.signedUrl = generateSignedKycUrl(
      seller.sellerProfile.aadhaarDocument.publicId
    );
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
    if (existing.isDeleted) {
      throw ApiError.badRequest("This email was previously terminated by administration and cannot be re-invited or registered.");
    }
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
      onboardingSource: "invite",
      commissionRate:
        typeof req.body.commissionRate === "number" && req.body.commissionRate >= 0
          ? req.body.commissionRate
          : 10,
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

  const filter = { role: "customer", isDeleted: { $ne: true } };

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

// @desc    Permanently delete/terminate customer account and blacklist email
// @route   DELETE /api/admin/customers/:id
// @access  Private/Admin
const deleteCustomerAccount = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" });
  if (!customer) throw ApiError.notFound("Customer not found");

  customer.isDeleted = true;
  customer.isActive = false;
  customer.deletedAt = new Date();
  customer.deletedBy = req.user._id;
  await customer.save({ validateBeforeSave: false });

  await Session.revokeAllUserSessions(customer._id);

  return sendSuccess(res, 200, "Customer account permanently terminated and email blacklisted");
});

// @desc    Permanently delete/terminate seller account, deactivate products, and blacklist email
// @route   DELETE /api/admin/sellers/:id
// @access  Private/Admin
const deleteSellerAccount = asyncHandler(async (req, res) => {
  const seller = await User.findOne({ _id: req.params.id, role: "seller" });
  if (!seller) throw ApiError.notFound("Seller not found");

  seller.isDeleted = true;
  seller.isActive = false;
  seller.deletedAt = new Date();
  seller.deletedBy = req.user._id;
  if (!seller.sellerProfile) seller.sellerProfile = {};
  seller.sellerProfile.isVacationMode = true;
  await seller.save({ validateBeforeSave: false });

  // Deactivate all products belonging to this seller
  await Product.updateMany(
    { seller: seller._id },
    { isActive: false, moderationStatus: "rejected" }
  );

  await Session.revokeAllUserSessions(seller._id);

  return sendSuccess(
    res,
    200,
    "Seller account permanently terminated, products deactivated, and email blacklisted"
  );
});

// @desc    Get signed URL for seller KYC document
// @route   GET /api/admin/sellers/:id/kyc-document/:docType
// @access  Private/Admin
const getSellerKycDocument = asyncHandler(async (req, res) => {
  const { id, docType } = req.params;
  const seller = await User.findOne({ _id: id, role: "seller" });
  if (!seller) throw ApiError.notFound("Seller not found");

  const doc =
    docType === "pan"
      ? seller.sellerProfile?.panDocument
      : docType === "aadhaar"
        ? seller.sellerProfile?.aadhaarDocument
        : null;

  if (!doc || (!doc.publicId && !doc.url)) {
    throw ApiError.notFound(`No ${docType.toUpperCase()} document uploaded for this seller`);
  }

  const documentUrl = doc.url || (doc.publicId ? generateSignedKycUrl(doc.publicId) : "");

  return sendSuccess(res, 200, "Signed document URL generated", {
    docType,
    url: documentUrl,
    signedUrl: documentUrl,
    expiresInSeconds: 600,
  });
});

// @desc    Get all marketplace payouts (filtered for seller, global for admin)
// @route   GET /api/admin/payouts
// @access  Private/Admin/Seller
const getMarketplacePayouts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  if (req.user.role === "seller") {
    filter.seller = req.user._id;
  } else if (req.query.seller) {
    filter.seller = req.query.seller;
  }

  if (req.query.period) {
    filter.settlementPeriod = req.query.period;
  }

  const total = await Payout.countDocuments(filter);
  const payouts = await Payout.find(filter)
    .populate("seller", "name email phone sellerProfile.businessName sellerProfile.bankDetails")
    .populate("subOrder", "subOrderNumber orderStatus totalPrice commissionAmount sellerEarnings")
    .populate("parentOrder", "orderNumber paymentMethod paymentStatus")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  // Financial aggregation
  const summaryFilter = req.user.role === "seller"
    ? { seller: req.user._id }
    : (req.query.seller && mongoose.isValidObjectId(req.query.seller) ? { seller: new mongoose.Types.ObjectId(req.query.seller) } : {});

  if (req.query.period) {
    summaryFilter.settlementPeriod = req.query.period;
  }

  let escrowBalance = 0;
  let coolingOffBalance = 0;
  let eligibleBalance = 0;
  let paidBalance = 0;
  let totalGross = 0;
  let totalCommission = 0;
  let totalGstOnCommission = 0;
  let totalTcs = 0;

  try {
    const metrics = await Payout.aggregate([
      { $match: summaryFilter },
      {
        $group: {
          _id: "$status",
          totalNet: { $sum: "$netAmount" },
          totalGross: { $sum: "$grossAmount" },
          totalCommission: { $sum: "$commissionAmount" },
          totalGstOnCommission: { $sum: "$gstOnCommission" },
          totalTcs: { $sum: "$tcsAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    metrics.forEach((m) => {
      totalGross += m.totalGross || 0;
      totalCommission += m.totalCommission || 0;
      totalGstOnCommission += m.totalGstOnCommission || 0;
      totalTcs += m.totalTcs || 0;
      if (m._id === "pending") escrowBalance += m.totalNet || 0;
      else if (m._id === "cooling_off") coolingOffBalance += m.totalNet || 0;
      else if (m._id === "eligible") eligibleBalance += m.totalNet || 0;
      else if (m._id === "completed") paidBalance += m.totalNet || 0;
    });
  } catch (err) {
    console.error("[getMarketplacePayouts] Aggregation error:", err.message);
  }

  return sendSuccess(res, 200, "Marketplace payouts fetched", payouts, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    financials: {
      escrowBalance,
      coolingOffBalance,
      eligibleBalance,
      paidBalance,
      totalGross,
      totalCommission,
      totalGstOnCommission,
      totalTcs,
    },
  });
});

// @desc    Release seller payout
// @route   POST /api/admin/payouts/:id/release
// @access  Private/Admin
const releaseSellerPayout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { transactionReference, notes } = req.body;

  const payout = await Payout.findById(id);
  if (!payout) throw ApiError.notFound("Payout record not found");

  if (payout.status === "completed") {
    throw ApiError.badRequest("This payout has already been released and completed.");
  }

  payout.status = "completed";
  payout.paidAt = new Date();
  payout.transactionReference = transactionReference || `TXN-${Date.now()}`;
  payout.utrNumber = payout.transactionReference;
  payout.notes = notes || "";
  payout.processedBy = req.user._id;
  await payout.save();

  if (payout.subOrder) {
    await SubOrder.findByIdAndUpdate(payout.subOrder, {
      $set: { payoutStatus: "paid" },
    });
  }

  return sendSuccess(res, 200, "Seller payout released successfully", { payout });
});

// @desc    Get monthly settlement summary batch (grouped by seller)
// @route   GET /api/admin/payouts/monthly-summary
// @access  Private/Admin
const getMonthlySettlementSummary = asyncHandler(async (req, res) => {
  const period = req.query.period || "";
  const sellerId = req.query.seller || null;

  const batches = await getMonthlySettlementBatch({ period, sellerId });
  return sendSuccess(res, 200, "Monthly settlement summary retrieved", batches);
});

// @desc    Export RBI compliant bulk NEFT CSV for a monthly batch
// @route   GET /api/admin/payouts/export-neft
// @access  Private/Admin
const exportMonthlySettlementCsv = asyncHandler(async (req, res) => {
  const period = req.query.period || "";
  const sellerId = req.query.seller || null;

  const batches = await getMonthlySettlementBatch({ period, sellerId });
  const csvContent = generateBankNeftCsv(batches, period);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="LyZov_Settlement_${period || "Current"}.csv"`
  );
  return res.status(200).send(csvContent);
});

// @desc    Release monthly batch with Bank UTR reference
// @route   POST /api/admin/payouts/release-monthly-batch
// @access  Private/Admin
const releaseMonthlyBatch = asyncHandler(async (req, res) => {
  const { period, sellerId, utrNumber, notes } = req.body;

  if (!utrNumber || !String(utrNumber).trim()) {
    throw ApiError.badRequest("Bank UTR reference number is required to release settlement batch");
  }

  const result = await releaseMonthlySettlementBatch({
    period,
    sellerId,
    utrNumber,
    processedBy: req.user._id,
    notes,
  });

  return sendSuccess(res, 200, `Monthly settlement released for ${result.releasedCount} payouts`, result);
});

// @desc    Trigger cooling-off maturity scan on demand
// @route   POST /api/admin/payouts/run-maturity-job
// @access  Private/Admin
const triggerSettlementMaturityJob = asyncHandler(async (req, res) => {
  const result = await promoteMaturedCoolingOffPayouts();
  return sendSuccess(res, 200, `Maturity job executed. Promoted ${result.promotedCount} payout(s) to eligible.`, result);
});

// ── Commission Rules CRUD ──

// @desc    Get all commission rules
// @route   GET /api/admin/commission-rules
// @access  Private/Admin
const getCommissionRules = asyncHandler(async (req, res) => {
  const rules = await CommissionRule.find()
    .populate("category", "name slug")
    .populate("seller", "name email sellerProfile.businessName")
    .sort("-createdAt");

  return sendSuccess(res, 200, "Commission rules fetched successfully", rules);
});

// @desc    Create a commission rule
// @route   POST /api/admin/commission-rules
// @access  Private/Admin
const createCommissionRule = asyncHandler(async (req, res) => {
  const {
    name,
    scope,
    category,
    seller,
    rateType,
    percentage,
    fixedFee,
    gstOnCommissionRate,
    tcsRate,
    description,
  } = req.body;

  if (!name || !scope) {
    throw ApiError.badRequest("Name and Scope are required");
  }

  const rule = await CommissionRule.create({
    name: String(name).trim(),
    scope,
    category: category || null,
    seller: seller || null,
    rateType: rateType || "percentage",
    percentage: Number(percentage) || 10,
    fixedFee: Number(fixedFee) || 0,
    gstOnCommissionRate: gstOnCommissionRate !== undefined ? Number(gstOnCommissionRate) : 18.0,
    tcsRate: tcsRate !== undefined ? Number(tcsRate) : 1.0,
    description: description || "",
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, "Commission rule created successfully", rule);
});

// @desc    Update a commission rule
// @route   PUT /api/admin/commission-rules/:id
// @access  Private/Admin
const updateCommissionRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await CommissionRule.findById(id);
  if (!rule) throw ApiError.notFound("Commission rule not found");

  const fields = [
    "name",
    "scope",
    "category",
    "seller",
    "rateType",
    "percentage",
    "fixedFee",
    "gstOnCommissionRate",
    "tcsRate",
    "isActive",
    "description",
  ];

  fields.forEach((f) => {
    if (req.body[f] !== undefined) rule[f] = req.body[f];
  });

  await rule.save();
  return sendSuccess(res, 200, "Commission rule updated successfully", rule);
});

// @desc    Delete a commission rule
// @route   DELETE /api/admin/commission-rules/:id
// @access  Private/Admin
const deleteCommissionRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await CommissionRule.findById(id);
  if (!rule) throw ApiError.notFound("Commission rule not found");

  await CommissionRule.findByIdAndDelete(id);
  return sendSuccess(res, 200, "Commission rule deleted successfully");
});

// @desc    Get products awaiting moderation
// @route   GET /api/admin/products/moderation
// @access  Private/Admin
const getProductModerationQueue = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter = {};
  if (req.query.status) {
    filter.moderationStatus = req.query.status;
  } else {
    filter.moderationStatus = { $in: ["pending_approval", "rejected"] };
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("seller", "name email sellerProfile.businessName sellerProfile.storeSlug")
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  return sendSuccess(res, 200, "Moderation queue fetched", products, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

// @desc    Approve or reject a product
// @route   PUT /api/admin/products/:id/moderation
// @access  Private/Admin
const moderateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;

  if (!["approved", "rejected", "pending_approval"].includes(status)) {
    throw ApiError.badRequest("Invalid moderation status. Must be approved, rejected, or pending_approval.");
  }

  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound("Product not found");

  product.moderationStatus = status;
  if (feedback !== undefined) product.moderationFeedback = String(feedback).trim();
  if (status === "rejected") {
    product.isActive = false;
  }
  await product.save();

  return sendSuccess(res, 200, `Product moderation updated to ${status}`, { product });
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
  deleteCustomerAccount,
  deleteSellerAccount,
  getSellerKycDocument,
  getMarketplacePayouts,
  releaseSellerPayout,
  getMonthlySettlementSummary,
  exportMonthlySettlementCsv,
  releaseMonthlyBatch,
  triggerSettlementMaturityJob,
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  getProductModerationQueue,
  moderateProduct,
};
