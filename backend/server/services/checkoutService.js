const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const emailService = require("./emailService");
const { deductStockForItems, restoreStockForItems } = require("./stockService");

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

const calculateTotals = (subtotal, coupon = null) => {
  const itemsPrice = round2(subtotal);
  const discountAmount = calculateDiscount(itemsPrice, coupon);
  const discountedSubtotal = Math.max(itemsPrice - discountAmount, 0);
  const taxPrice = round2(discountedSubtotal * TAX_RATE);
  const shippingPrice = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const totalPrice = round2(discountedSubtotal + taxPrice + shippingPrice);
  return { itemsPrice, discountAmount, taxPrice, shippingPrice, totalPrice };
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

    const product = await Product.findById(cartItem.product);
    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product "${cartItem.name}" is no longer available`);
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

    items.push({
      product: product._id,
      variantId: cartItem.variantId || null,
      name: product.title,
      image: product.images?.[0]?.url || cartItem.image || "",
      price: livePrice,
      color: cartItem.color || "",
      size: cartItem.size || "",
      quantity: qty,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

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
    if (subtotal < coupon.minPurchaseAmount) {
      await resetCartCoupon(cart);
      throw ApiError.badRequest(`Minimum purchase of ₹${coupon.minPurchaseAmount} required for coupon ${coupon.code}`);
    }
  }

  const totals = calculateTotals(subtotal, coupon);
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

  try {
    if (snapshot.couponCode) {
      await redeemCoupon(snapshot.couponCode, user._id);
      couponRedeemed = true;
    }

    const isPaid = Boolean(payment?.razorpayPaymentId);

    const order = await Order.create({
      user: user._id,
      items: snapshot.items,
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

  emailService.sendOrderConfirmation({ order, user }).catch((err) =>
    console.error("[EmailService] Order confirmation email error:", err.message)
  );
  emailService.sendSellerNewOrder({ order, user }).catch((err) =>
    console.error("[EmailService] Seller order alert error:", err.message)
  );
};

module.exports = {
  MAX_ITEM_QUANTITY,
  pickShippingAddress,
  assertShippingAddress,
  calculateDiscount,
  calculateTotals,
  buildCheckoutSnapshot,
  redeemCoupon,
  releaseCoupon,
  createOrderFromSnapshot,
  afterOrderPlaced,
};
