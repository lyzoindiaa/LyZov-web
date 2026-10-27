const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const SubOrder = require("../models/SubOrder");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * Coupon ownership model
 *  - Super Admin (role "admin")  -> "platform" coupons: whole cart, funded by the platform.
 *                                   Can also view / pause / delete any seller coupon (moderation).
 *  - Seller (role "seller")      -> "seller" coupons: only that seller's products, funded by the seller.
 *                                   Can only see and manage their own coupons.
 */

const EDITABLE_FIELDS = [
  "description",
  "discountType",
  "discountValue",
  "minPurchaseAmount",
  "maxDiscountAmount",
  "validFrom",
  "validUntil",
  "usageLimit",
  "isActive",
];

const isAdmin = (user) => user?.role === "admin";

const toNullableNumber = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

/** Whitelists + normalises editable fields (blocks mass-assignment of usedCount/usersUsed/scope/seller). */
const pickCouponFields = (body = {}) => {
  const data = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    data[key] = body[key];
  }
  if (data.description !== undefined) data.description = String(data.description).trim().slice(0, 300);
  if (data.discountValue !== undefined) data.discountValue = Number(data.discountValue);
  if (data.minPurchaseAmount !== undefined) data.minPurchaseAmount = Number(data.minPurchaseAmount) || 0;
  if (data.maxDiscountAmount !== undefined) data.maxDiscountAmount = toNullableNumber(data.maxDiscountAmount);
  if (data.usageLimit !== undefined) data.usageLimit = toNullableNumber(data.usageLimit);
  if (data.isActive !== undefined) data.isActive = data.isActive === true || data.isActive === "true";
  return data;
};

const assertCouponRules = (coupon) => {
  if (!["percentage", "flat"].includes(coupon.discountType)) {
    throw ApiError.badRequest("Discount type must be 'percentage' or 'flat'");
  }
  if (!Number.isFinite(coupon.discountValue) || coupon.discountValue <= 0) {
    throw ApiError.badRequest("Discount value must be greater than 0");
  }
  if (coupon.discountType === "percentage" && coupon.discountValue > 90) {
    throw ApiError.badRequest("Percentage discount cannot exceed 90%");
  }
  if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount < 0) {
    throw ApiError.badRequest("Maximum discount cannot be negative");
  }
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageLimit < 1) {
    throw ApiError.badRequest("Usage limit must be at least 1 (or empty for unlimited)");
  }
  const from = coupon.validFrom ? new Date(coupon.validFrom) : new Date();
  const until = new Date(coupon.validUntil);
  if (Number.isNaN(until.getTime())) throw ApiError.badRequest("A valid expiry date is required");
  if (until <= from) throw ApiError.badRequest("Expiry date must be after the start date");
};

/** Loads a coupon and enforces ownership (sellers may only touch their own coupons). */
const loadOwnedCoupon = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.badRequest("Invalid coupon id");
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw ApiError.notFound("Coupon not found");
  if (!isAdmin(req.user)) {
    const ownsCoupon = coupon.scope === "seller" && coupon.seller?.toString() === req.user._id.toString();
    if (!ownsCoupon) throw ApiError.notFound("Coupon not found");
  }
  return coupon;
};

/** Redemption analytics per coupon code (orders, discount given, revenue influenced). */
const buildRedemptionStats = async (coupons) => {
  const stats = new Map();
  if (!coupons.length) return stats;

  const platformCodes = coupons.filter((c) => c.scope !== "seller").map((c) => c.code);
  const sellerCoupons = coupons.filter((c) => c.scope === "seller");

  if (platformCodes.length) {
    const rows = await Order.aggregate([
      { $match: { couponCode: { $in: platformCodes }, orderStatus: { $nin: ["cancelled"] } } },
      {
        $group: {
          _id: "$couponCode",
          orders: { $sum: 1 },
          discountGiven: { $sum: "$discountAmount" },
          revenue: { $sum: "$totalPrice" },
        },
      },
    ]);
    rows.forEach((r) => stats.set(r._id, r));
  }

  if (sellerCoupons.length) {
    // For seller coupons only that seller's sub-orders count towards their revenue.
    const parentRows = await Order.find(
      { couponCode: { $in: sellerCoupons.map((c) => c.code) }, orderStatus: { $nin: ["cancelled"] } },
      "_id couponCode"
    ).lean();
    const codeByOrder = new Map(parentRows.map((o) => [o._id.toString(), o.couponCode]));
    const sellerByCode = new Map(sellerCoupons.map((c) => [c.code, c.seller?.toString()]));

    if (parentRows.length) {
      const subs = await SubOrder.find(
        { parentOrder: { $in: parentRows.map((o) => o._id) }, orderStatus: { $nin: ["cancelled"] } },
        "parentOrder seller discountAmount totalPrice"
      ).lean();
      for (const sub of subs) {
        const code = codeByOrder.get(sub.parentOrder.toString());
        if (!code || sellerByCode.get(code) !== sub.seller?.toString()) continue;
        const row = stats.get(code) || { _id: code, orders: 0, discountGiven: 0, revenue: 0 };
        row.orders += 1;
        row.discountGiven += sub.discountAmount || 0;
        row.revenue += sub.totalPrice || 0;
        stats.set(code, row);
      }
    }
  }
  return stats;
};

// @desc    List coupons (admin: all / filterable, seller: own only) with redemption stats
// @route   GET /api/coupons?scope=platform|seller&status=active|expired|inactive&search=
// @access  Private/Seller|Admin
const getCoupons = asyncHandler(async (req, res) => {
  const filter = {};
  if (isAdmin(req.user)) {
    if (["platform", "seller"].includes(req.query.scope)) filter.scope = req.query.scope;
  } else {
    filter.scope = "seller";
    filter.seller = req.user._id;
  }

  const now = new Date();
  if (req.query.status === "active") {
    Object.assign(filter, { isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now } });
  } else if (req.query.status === "expired") {
    filter.validUntil = { $lt: now };
  } else if (req.query.status === "inactive") {
    filter.isActive = false;
  } else if (req.query.status === "scheduled") {
    filter.validFrom = { $gt: now };
  }

  if (req.query.search) {
    const escaped = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40);
    filter.code = { $regex: escaped, $options: "i" };
  }

  const coupons = await Coupon.find(filter)
    .select("-usersUsed")
    .populate("seller", "name sellerProfile.businessName")
    .sort("-createdAt")
    .lean();

  const stats = await buildRedemptionStats(coupons);
  const data = coupons.map((c) => {
    const s = stats.get(c.code);
    return {
      ...c,
      stats: {
        orders: s?.orders || 0,
        discountGiven: Math.round((s?.discountGiven || 0) * 100) / 100,
        revenue: Math.round((s?.revenue || 0) * 100) / 100,
      },
    };
  });

  return sendSuccess(res, 200, "Coupons fetched successfully", data);
});

// @desc    Create a coupon (admin -> platform coupon, seller -> own store coupon)
// @route   POST /api/coupons
// @access  Private/Seller|Admin
const createCoupon = asyncHandler(async (req, res) => {
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
    throw ApiError.badRequest("Coupon code must be 3-20 characters (letters, numbers, - or _)");
  }

  const existing = await Coupon.findOne({ code });
  if (existing) throw ApiError.conflict("A coupon with this code already exists");

  const data = pickCouponFields(req.body);
  assertCouponRules(data);

  const ownership = isAdmin(req.user)
    ? { scope: "platform", seller: null }
    : { scope: "seller", seller: req.user._id };

  const coupon = await Coupon.create({
    ...data,
    code,
    ...ownership,
    createdBy: req.user._id,
    usedCount: 0,
    usersUsed: [],
  });

  return sendSuccess(res, 201, "Coupon created successfully", coupon);
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Seller (own) | Admin (any)
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await loadOwnedCoupon(req);
  const updates = pickCouponFields(req.body);

  // Super Admin may only pause/resume seller coupons (moderation), not rewrite their terms.
  if (isAdmin(req.user) && coupon.scope === "seller") {
    const keys = Object.keys(updates).filter((k) => k !== "isActive");
    if (keys.length) throw ApiError.forbidden("Seller coupons can only be paused or resumed by the Super Admin");
  }

  Object.assign(coupon, updates);
  assertCouponRules(coupon);
  if (coupon.usageLimit !== null && coupon.usageLimit < coupon.usedCount) {
    throw ApiError.badRequest(`Usage limit cannot be lower than current redemptions (${coupon.usedCount})`);
  }

  await coupon.save();
  return sendSuccess(res, 200, "Coupon updated successfully", coupon);
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Seller (own) | Admin (any)
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await loadOwnedCoupon(req);
  await coupon.deleteOne();
  return sendSuccess(res, 200, "Coupon deleted successfully");
});

// @desc    Validate a coupon code (customer facing, without applying)
// @route   GET /api/coupons/validate/:code
// @access  Private
const validateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase() }).populate(
    "seller",
    "sellerProfile.businessName"
  );
  if (!coupon || !coupon.isValid()) {
    throw ApiError.badRequest("Invalid or expired coupon code");
  }

  return sendSuccess(res, 200, "Coupon is valid", {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minPurchaseAmount: coupon.minPurchaseAmount,
    maxDiscountAmount: coupon.maxDiscountAmount,
    scope: coupon.scope,
    storeName: coupon.scope === "seller" ? coupon.seller?.sellerProfile?.businessName || null : null,
  });
});

module.exports = { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
