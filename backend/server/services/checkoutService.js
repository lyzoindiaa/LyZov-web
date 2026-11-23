const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const SubOrder = require("../models/SubOrder");
const Payout = require("../models/Payout");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const emailService = require("./emailService");
const { deductStockForItems, restoreStockForItems } = require("./stockService");
const { resolveCommissionRule, calculateSubOrderFinancials } = require("./commissionService");

const TAX_RATE = Number(process.env.TAX_RATE) || 0; // 0 default for GST-inclusive catalog prices
const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD) || 999;
const FLAT_SHIPPING_RATE = Number(process.env.FLAT_SHIPPING_RATE) || 99;
const MAX_ITEM_QUANTITY = Number(process.env.MAX_ITEM_QUANTITY) || 20;

const ADDRESS_FIELDS = [
  "fullName",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
];

const round2 = (n) => Math.round(n * 100) / 100;

/** Whitelist the address fields (prevents mass-assignment into the order document). */
const pickShippingAddress = (address = {}) => {
  const picked = {};
  for (const key of ADDRESS_FIELDS) {
    if (address[key] !== undefined && address[key] !== null) picked[key] = String(address[key]).trim();
  }
  if (!picked.country) picked.country = "India";
  return picked;
};

const assertShippingAddress = (address) => {
  const required = ["fullName", "phone", "addressLine1", "city", "state", "postalCode", "country"];
  const missing = required.filter((k) => !address[k]);
  if (missing.length) {
    throw ApiError.badRequest(`Shipping address is incomplete (missing: ${missing.join(", ")})`);
  }
};

/**
 * Discount is always computed from the *live* coupon document:
 *  - percentage is capped at 100 and at maxDiscountAmount (when set)
 *  - flat is capped at the subtotal
 */
const calculateDiscount = (subtotal, coupon) => {
  if (!coupon) return 0;
  let discount;
  if (coupon.discountType === "percentage") {
    const pct = Math.min(Math.max(Number(coupon.discountValue) || 0, 0), 100);
    discount = (subtotal * pct) / 100;
  } else {
    discount = Math.max(Number(coupon.discountValue) || 0, 0);
  }
  if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  return round2(Math.min(discount, subtotal));
};

const parseGstRate = (rateStr) => {
  if (!rateStr) return 0;
  if (typeof rateStr === "number") return rateStr > 1 ? rateStr / 100 : rateStr;
  const match = String(rateStr).match(/\d+(\.\d+)?/);
  if (!match) return 0;
  const num = parseFloat(match[0]);
  return num > 1 ? num / 100 : num;
};

const PLATFORM_SELLER_KEY = "platform_admin";

/** Normalises a seller reference (ObjectId | populated doc | string | null) into a string key. */
const sellerKeyOf = (seller) => {
  if (!seller) return PLATFORM_SELLER_KEY;
  if (typeof seller === "object" && seller._id) return seller._id.toString();
  return seller.toString();
};

/** A coupon is seller-scoped when it was created by a seller for their own store. */
const isSellerScopedCoupon = (coupon) => Boolean(coupon && coupon.scope === "seller" && coupon.seller);

/** Platform coupons apply to every item; seller coupons only to that seller's items. */
const isCouponEligibleItem = (item, coupon) => {
  if (!coupon) return false;
  if (isSellerScopedCoupon(coupon)) return sellerKeyOf(item.seller) === sellerKeyOf(coupon.seller);
  return true;
};

const getCouponEligibleSubtotal = (items = [], coupon = null) =>
  round2(
    items
      .filter((i) => isCouponEligibleItem(i, coupon))
      .reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

const calculateTotals = (items = [], coupon = null) => {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsPrice = round2(subtotal);
  const eligibleSubtotal = getCouponEligibleSubtotal(items, coupon);
  const discountAmount = calculateDiscount(eligibleSubtotal, coupon);
  const discountedSubtotal = Math.max(itemsPrice - discountAmount, 0);

  // Dynamically calculate GST based on stored product gstRate.
  // The discount only reduces the taxable value of the items it applies to.
  let taxPrice = 0;
  const eligibleFactor = eligibleSubtotal > 0 ? (eligibleSubtotal - discountAmount) / eligibleSubtotal : 1;
  for (const item of items) {
    const rate = parseGstRate(item.gstRate);
    const itemTotal = item.price * item.quantity;
    const factor = isCouponEligibleItem(item, coupon) ? eligibleFactor : 1;
    taxPrice += itemTotal * factor * rate;
  }
  taxPrice = round2(taxPrice);

  const shippingPrice = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const totalPrice = round2(discountedSubtotal + taxPrice + shippingPrice);
  return { itemsPrice, discountAmount, taxPrice, shippingPrice, totalPrice, couponEligibleSubtotal: eligibleSubtotal };
};

/**
 * Splits the order-level coupon discount across seller sub-orders and records who funds it.
 *  - seller coupon   -> 100% of the discount sits on the owning seller's sub-order, seller-funded
 *  - platform coupon -> discount is shared proportionally (customer-facing), platform-funded,
 *                       so seller payouts are computed on the pre-discount amount
 * Returns Map<sellerKey, { amount, fundedBy }>.
 */
const allocateCouponDiscount = ({ sellerItemsMap, itemsPrice, discountAmount, coupon }) => {
  const allocation = new Map();
  const totalDiscount = round2(Number(discountAmount) || 0);

  for (const sellerKey of sellerItemsMap.keys()) {
    allocation.set(sellerKey, { amount: 0, fundedBy: "none" });
  }
  if (totalDiscount <= 0) return allocation;

  if (isSellerScopedCoupon(coupon)) {
    const ownerKey = sellerKeyOf(coupon.seller);
    if (allocation.has(ownerKey)) {
      allocation.set(ownerKey, { amount: totalDiscount, fundedBy: "seller" });
    }
    return allocation;
  }

  // Platform coupon: proportional split, last seller absorbs rounding so the sum is exact.
  const keys = [...sellerItemsMap.keys()];
  let allocated = 0;
  keys.forEach((sellerKey, idx) => {
    const sellerItemsPrice = round2(
      sellerItemsMap.get(sellerKey).reduce((acc, it) => acc + it.price * it.quantity, 0)
    );
    const amount =
      idx === keys.length - 1
        ? round2(totalDiscount - allocated)
        : round2(itemsPrice > 0 ? (totalDiscount * sellerItemsPrice) / itemsPrice : 0);
    allocated = round2(allocated + amount);
    allocation.set(sellerKey, { amount, fundedBy: "platform" });
  });
  return allocation;
};

const resetCartCoupon = async (cart) => {
  cart.coupon = { code: null, discountType: null, discountValue: 0 };
  await cart.save();
};

/**
 * Re-prices the user's cart from the database (never trusting cart.price / cart.coupon.discountValue),
 * re-validates stock, product availability and the coupon, and returns a frozen snapshot.
 */
const buildCheckoutSnapshot = async (user) => {
  if (user && (user.role === "admin" || user.role === "seller")) {
    const roleName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    throw ApiError.forbidden(
      `${roleName} accounts cannot place orders. Please use a customer account.`
    );
  }

  const cart = await Cart.findOne({ user: user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  const items = [];
  for (const cartItem of cart.items) {
    const qty = Number(cartItem.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      throw ApiError.badRequest(`Invalid quantity for "${cartItem.name}"`);
    }
    if (qty > MAX_ITEM_QUANTITY) {
      throw ApiError.badRequest(`You can order at most ${MAX_ITEM_QUANTITY} units of "${cartItem.name}" at a time`);
    }

    const product = await Product.findById(cartItem.product).populate("seller", "sellerProfile.isVacationMode sellerProfile.businessName");
    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product "${cartItem.name}" is no longer available`);
    }
    if (product.seller?.sellerProfile?.isVacationMode) {
      throw ApiError.badRequest(`Product "${product.title}" cannot be ordered because the merchant is currently on vacation.`);
    }

    let availableStock = product.stock;
    if (cartItem.variantId) {
      const variant = product.variants.id(cartItem.variantId);
      if (!variant) {
        throw ApiError.badRequest(`Variant for "${cartItem.name}" is no longer available`);
      }
      availableStock = variant.stock;
    }
    if (availableStock < qty) {
      throw ApiError.badRequest(`Only ${availableStock} item(s) in stock for "${product.title}"`);
    }

    // Same price rule as cartController.addItemToCart, but read from the DB *now*.
    const livePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

    const resolvedSellerId =
      product.seller && typeof product.seller === "object" && product.seller._id
        ? product.seller._id
        : product.seller || null;

    items.push({
      product: product._id,
      variantId: cartItem.variantId || null,
      name: product.title,
      image: product.images?.[0]?.url || cartItem.image || "",
      price: livePrice,
      color: cartItem.color || "",
      size: cartItem.size || "",
      quantity: qty,
      gstRate: product.gstRate || cartItem.gstRate || null,
      seller: resolvedSellerId,
      category: product.category || null,
    });
  }

  let coupon = null;
  if (cart.coupon?.code) {
    coupon = await Coupon.findOne({ code: cart.coupon.code.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      await resetCartCoupon(cart);
      throw ApiError.badRequest("The applied coupon is no longer valid or has expired.");
    }
    if (coupon.usersUsed.some((u) => u.toString() === user._id.toString())) {
      await resetCartCoupon(cart);
      throw ApiError.badRequest("You have already used this coupon.");
    }
    const eligibleSubtotal = getCouponEligibleSubtotal(items, coupon);
    if (isSellerScopedCoupon(coupon) && eligibleSubtotal <= 0) {
      await resetCartCoupon(cart);
      throw ApiError.badRequest(`Coupon ${coupon.code} only applies to products from the store that issued it.`);
    }
    if (eligibleSubtotal < coupon.minPurchaseAmount) {
      await resetCartCoupon(cart);
      throw ApiError.badRequest(`Minimum purchase of ₹${coupon.minPurchaseAmount} required for coupon ${coupon.code}`);
    }
  }

  const totals = calculateTotals(items, coupon);
  return { cart, items, coupon, couponCode: coupon?.code || null, ...totals };
};

/**
 * Atomic coupon redemption: the conditions live in the query, so two parallel orders can never both
 * redeem a single-use coupon or exceed usageLimit.
 */
const redeemCoupon = async (code, userId) => {
  if (!code) return null;
  const now = new Date();
  const redeemed = await Coupon.findOneAndUpdate(
    {
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      usersUsed: { $ne: userId },
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 }, $push: { usersUsed: userId } },
    { new: true }
  );
  if (!redeemed) {
    throw ApiError.badRequest("The applied coupon is no longer valid, has expired, or was already used.");
  }
  return redeemed;
};

const releaseCoupon = async (code, userId) => {
  if (!code) return;
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase(), usersUsed: userId },
    { $inc: { usedCount: -1 }, $pull: { usersUsed: userId } }
  ).catch(() => {});
};

/**
 * Creates the Order from a frozen snapshot: deduct stock -> redeem coupon -> create order,
 * rolling everything back if a later step fails.
 */
const createOrderFromSnapshot = async ({ user, snapshot, shippingAddress, paymentMethod, payment }) => {
  const deducted = await deductStockForItems(snapshot.items);
  let couponRedeemed = false;
  let redeemedCoupon = null;

  try {
    if (snapshot.couponCode) {
      redeemedCoupon = await redeemCoupon(snapshot.couponCode, user._id);
      couponRedeemed = true;
    }

    const isPaid = Boolean(payment?.razorpayPaymentId);

    const cleanItems = snapshot.items.map((it) => ({
      ...it,
      seller: it.seller && typeof it.seller === "object" && it.seller._id ? it.seller._id : it.seller || null,
    }));

    const order = await Order.create({
      user: user._id,
      items: cleanItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: isPaid ? "captured" : "cod_pending",
      payment: payment || {},
      itemsPrice: snapshot.itemsPrice,
      taxPrice: snapshot.taxPrice,
      shippingPrice: snapshot.shippingPrice,
      discountAmount: snapshot.discountAmount,
      couponCode: snapshot.couponCode,
      totalPrice: snapshot.totalPrice,
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      statusHistory: [{ status: "pending", note: isPaid ? "Order placed & payment captured" : "Order placed" }],
    });

    // ── Multi-Seller Split: Create isolated SubOrder per seller ──
    const sellerItemsMap = new Map();
    for (const item of cleanItems) {
      const rawSeller = item.seller;
      const sellerId =
        rawSeller && typeof rawSeller === "object" && rawSeller._id
          ? rawSeller._id
          : rawSeller;
      const sellerKey = sellerId ? sellerId.toString() : "platform_admin";
      if (!sellerItemsMap.has(sellerKey)) {
        sellerItemsMap.set(sellerKey, []);
      }
      sellerItemsMap.get(sellerKey).push({
        ...item,
        seller: sellerId || null,
      });
    }

    // Resolve platform fallback seller if needed
    let defaultAdminId = null;
    const findAdmin = async () => {
      if (!defaultAdminId) {
        const adminUser = await User.findOne({ role: "admin" }).select("_id");
        defaultAdminId = adminUser ? adminUser._id : user._id;
      }
      return defaultAdminId;
    };

    const createdSubOrders = [];
    let subOrderIndex = 1;

    // Who funds the coupon discount, per seller (platform vs seller coupon)
    const discountAllocation = allocateCouponDiscount({
      sellerItemsMap,
      itemsPrice: snapshot.itemsPrice,
      discountAmount: snapshot.discountAmount,
      coupon: redeemedCoupon || snapshot.coupon || null,
    });

    for (const [sellerKey, sellerItems] of sellerItemsMap.entries()) {
      let rawSellerId = sellerKey !== "platform_admin" ? sellerKey : await findAdmin();
      let sellerId =
        rawSellerId && typeof rawSellerId === "object" && rawSellerId._id
          ? rawSellerId._id
          : rawSellerId;
      /* [SINGLE-SELLER MODE] Commission/GST/TCS deductions disabled — 0% goes to admin, 100% to seller.
      const sellerUser = await User.findById(sellerId).select("sellerProfile");
      const fallbackRate =
        typeof sellerUser?.sellerProfile?.commissionRate === "number"
          ? sellerUser.sellerProfile.commissionRate
          : 10; // Default platform commission: 10%
      */

      const sellerItemsPrice = round2(
        sellerItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
      );

      // Proportional tax/shipping allocation; discount follows the coupon funding model
      const proportion = snapshot.itemsPrice > 0 ? sellerItemsPrice / snapshot.itemsPrice : 1;
      const sellerAllocation = discountAllocation.get(sellerKey) || { amount: 0, fundedBy: "none" };
      const sellerDiscount = round2(sellerAllocation.amount);
      const platformFundedDiscount = sellerAllocation.fundedBy === "platform" ? sellerDiscount : 0;
      const sellerFundedDiscount = sellerAllocation.fundedBy === "seller" ? sellerDiscount : 0;
      const sellerTax = round2(snapshot.taxPrice * proportion);
      // Flat shipping assigned to first sub-order or shared proportionally
      const sellerShipping = round2(snapshot.shippingPrice * proportion);
      // What the customer pays for this sub-order
      const sellerTotal = round2(sellerItemsPrice - sellerDiscount + sellerTax + sellerShipping);
      // What the seller is settled on: platform-funded discounts are added back
      // const sellerGross = round2(sellerTotal + platformFundedDiscount);

      /* [SINGLE-SELLER MODE] Multi-vendor commission rule & statutory deductions commented out.
      // Resolve dynamic commission rule (Seller > Category > Global > Fallback)
      const sampleCategoryId = sellerItems[0]?.category || sellerItems[0]?.product?.category || null;
      const rule = await resolveCommissionRule({
        sellerId,
        categoryId: sampleCategoryId,
        fallbackRate,
      });

      const financials = calculateSubOrderFinancials({
        sellerItemsPrice,
        sellerTotal: sellerGross,
        rule,
      });
      */
      const financials = {
        commissionRate: 0,
        commissionAmount: 0,
        gstOnCommission: 0,
        tcsAmount: 0,
        sellerEarnings: sellerTotal,
        settlementPeriod: "",
      };

      const subOrderNumber = `${order.orderNumber}-S${String(subOrderIndex++).padStart(2, "0")}`;

      const subOrder = await SubOrder.create({
        parentOrder: order._id,
        subOrderNumber,
        seller: sellerId,
        customer: user._id,
        items: sellerItems,
        shippingAddress,
        paymentMethod,
        paymentStatus: isPaid ? "captured" : "cod_pending",
        itemsPrice: sellerItemsPrice,
        taxPrice: sellerTax,
        shippingPrice: sellerShipping,
        discountAmount: sellerDiscount,
        couponFundedBy: sellerAllocation.fundedBy,
        platformFundedDiscount,
        sellerFundedDiscount,
        totalPrice: sellerTotal,
        commissionRate: financials.commissionRate,
        commissionAmount: financials.commissionAmount,
        gstOnCommission: financials.gstOnCommission,
        tcsAmount: financials.tcsAmount,
        sellerEarnings: financials.sellerEarnings,
        settlementPeriod: financials.settlementPeriod,
        payoutStatus: "pending",
        orderStatus: "pending",
        statusHistory: [{ status: "pending", note: "Sub-order created and waiting for seller processing" }],
      });

      /* [SINGLE-SELLER MODE] Multi-vendor Payout ledger creation disabled. Uncomment when re-enabling multi-vendor.
      // Create linked Payout ledger entry
      const returnWindowDays = 7;
      const eligibleDate = new Date(Date.now() + returnWindowDays * 24 * 60 * 60 * 1000);
      const payout = await Payout.create({
        seller: sellerId,
        subOrder: subOrder._id,
        parentOrder: order._id,
        grossAmount: sellerGross,
        commissionRate: financials.commissionRate,
        commissionAmount: financials.commissionAmount,
        gstOnCommission: financials.gstOnCommission,
        tcsAmount: financials.tcsAmount,
        netAmount: financials.sellerEarnings,
        settlementPeriod: financials.settlementPeriod,
        commissionRuleSnapshot: financials.ruleSnapshot,
        status: "pending",
        eligibleAt: eligibleDate,
        bankDetailsSnapshot: sellerUser?.sellerProfile?.bankDetails || {},
      });

      subOrder.payoutId = payout._id;
      await subOrder.save();
      */
      createdSubOrders.push(subOrder._id);
    }

    if (createdSubOrders.length > 0) {
      order.hasSubOrders = true;
      order.subOrders = createdSubOrders;
      await order.save();
    }

    return order;
  } catch (err) {
    await restoreStockForItems(deducted);
    if (couponRedeemed) await releaseCoupon(snapshot.couponCode, user._id);
    throw err;
  }
};

/** Cart cleanup + notifications + emails after an order has been created. */
const afterOrderPlaced = async ({ user, order }) => {
  await Cart.findOneAndUpdate(
    { user: user._id },
    { $set: { items: [], coupon: { code: null, discountType: null, discountValue: 0 } } }
  );

  await Notification.create({
    user: user._id,
    title: "Order placed successfully",
    message: `Your order ${order.orderNumber} has been placed and is being processed.`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  // Notify each seller that received an order
  const distinctSellers = [
    ...new Set(
      (order.items || [])
        .map((i) => i.seller?.toString())
        .filter((id) => id && id !== user._id.toString())
    ),
  ];

  for (const sellerId of distinctSellers) {
    await Notification.create({
      user: sellerId,
      title: "New Customer Order Assigned",
      message: `You have received order items for order #${order.orderNumber}. Open Orders to prepare dispatch.`,
      type: "order",
      link: `/seller/orders`,
    }).catch(() => {});
  }

  // Await email dispatch via Promise.allSettled so serverless runtimes (Vercel) do not freeze before sockets finish
  await Promise.allSettled([
    emailService.sendOrderConfirmation({ order, user }).catch((err) =>
      console.error("[EmailService] Order confirmation email error:", err.message)
    ),
    emailService.sendSellerNewOrder({ order, user }).catch((err) =>
      console.error("[EmailService] Seller order alert error:", err.message)
    ),
  ]);
};

module.exports = {
  MAX_ITEM_QUANTITY,
  pickShippingAddress,
  assertShippingAddress,
  calculateDiscount,
  calculateTotals,
  sellerKeyOf,
  isSellerScopedCoupon,
  isCouponEligibleItem,
  getCouponEligibleSubtotal,
  allocateCouponDiscount,
  buildCheckoutSnapshot,
  redeemCoupon,
  releaseCoupon,
  createOrderFromSnapshot,
  afterOrderPlaced,
};
