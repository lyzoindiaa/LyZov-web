const crypto = require("crypto");
const PaymentSession = require("../models/PaymentSession");
const Order = require("../models/Order");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { getRazorpay, getKeySecret } = require("../config/razorpay");
const {
  buildCheckoutSnapshot,
  createOrderFromSnapshot,
  afterOrderPlaced,
} = require("./checkoutService");

const SESSION_TTL_MS = 20 * 60 * 1000;

const safeEqualHex = (a, b) => {
  try {
    const bufA = Buffer.from(String(a), "utf8");
    const bufB = Buffer.from(String(b), "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/** Checkout signature: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret) */
const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", getKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
};

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret) */
const verifyWebhookSignature = (rawBody, signature, secret) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
};

const fingerprintFor = (userId, snapshot, shippingAddress) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        u: String(userId),
        items: snapshot.items.map((i) => [String(i.product), String(i.variantId || ""), i.price, i.quantity]),
        coupon: snapshot.couponCode,
        total: snapshot.totalPrice,
        address: shippingAddress,
      })
    )
    .digest("hex");

/**
 * Creates (or reuses) a PaymentSession + Razorpay order for the user's current cart.
 * Amount is computed server-side from DB prices and frozen in the session.
 */
const createRazorpaySession = async ({ user, shippingAddress }) => {
  const rzp = getRazorpay(); // also enforces the live/test key guard

  const snapshot = await buildCheckoutSnapshot(user);
  const amount = Math.round(snapshot.totalPrice * 100); // paise
  if (amount < 100) {
    throw ApiError.badRequest("Order total is too low for online payment. Please use Cash on Delivery.");
  }

  const fingerprint = fingerprintFor(user._id, snapshot, shippingAddress);

  // Reuse an unchanged, still-open session (page refresh / retry) instead of creating orphans.
  const existing = await PaymentSession.findOne({
    user: user._id,
    fingerprint,
    status: "created",
    expiresAt: { $gt: new Date() },
  });
  if (existing) return existing;

  // Expire stale open sessions for this user.
  await PaymentSession.updateMany(
    { user: user._id, status: "created", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );

  const session = new PaymentSession({
    user: user._id,
    razorpayOrderId: `pending_${crypto.randomBytes(8).toString("hex")}`, // replaced right below
    amount,
    currency: "INR",
    items: snapshot.items,
    shippingAddress,
    couponCode: snapshot.couponCode,
    itemsPrice: snapshot.itemsPrice,
    discountAmount: snapshot.discountAmount,
    taxPrice: snapshot.taxPrice,
    shippingPrice: snapshot.shippingPrice,
    totalPrice: snapshot.totalPrice,
    fingerprint,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });

  let rzpOrder;
  try {
    rzpOrder = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt: `lz_${session._id.toString()}`.slice(0, 40),
      notes: { sessionId: session._id.toString(), userId: user._id.toString() },
    });
  } catch (err) {
    console.error("[Razorpay] order create failed:", err?.error || err?.message || err);
    throw ApiError.internal("Could not start the payment. Please try again.");
  }

  session.razorpayOrderId = rzpOrder.id;
  await session.save();
  return session;
};

const refundPayment = async ({ paymentId, amountPaise, reason, orderId }) => {
  const rzp = getRazorpay();
  const payload = {
    speed: "normal",
    notes: { reason: String(reason || "Order cancelled").slice(0, 200), orderId: String(orderId || "") },
  };
  if (amountPaise) payload.amount = amountPaise;
  return rzp.payments.refund(paymentId, payload);
};

/**
 * Turns a verified/captured payment into an Order. Idempotent and safe under races
 * (checkout verify + webhook can run at the same time): the first caller atomically claims
 * the session, every other caller gets the existing order.
 */
const finalizePaymentSession = async ({ session, paymentId }) => {
  const rzp = getRazorpay();

  // Already done (verify and webhook both end up here)
  if (session.status === "completed" && session.order) {
    const existingOrder = await Order.findById(session.order);
    return { status: "completed", order: existingOrder };
  }
  if (session.status === "refunded" || session.status === "expired") {
    throw ApiError.conflict("This payment session is closed. If you were charged, the amount will be refunded.");
  }

  // 1) Ask Razorpay what really happened (never trust the client)
  let payment;
  try {
    payment = await rzp.payments.fetch(paymentId);
  } catch (err) {
    console.error("[Razorpay] payment fetch failed:", err?.error || err?.message || err);
    throw ApiError.badRequest("Could not confirm the payment with Razorpay.");
  }

  if (payment.order_id !== session.razorpayOrderId) {
    throw ApiError.badRequest("Payment does not belong to this checkout session.");
  }
  if (payment.currency !== session.currency || Number(payment.amount) !== Number(session.amount)) {
    throw ApiError.badRequest("Payment amount does not match the order total.");
  }
  if (payment.status === "authorized") {
    try {
      payment = await rzp.payments.capture(paymentId, session.amount, session.currency);
    } catch (err) {
      console.error("[Razorpay] capture failed:", err?.error || err?.message || err);
      throw ApiError.badRequest("Payment could not be captured.");
    }
  }
  if (payment.status !== "captured") {
    throw ApiError.badRequest("Payment has not been completed.");
  }

  // 2) Atomically claim the session (single-use; blocks replay and double processing)
  const claimed = await PaymentSession.findOneAndUpdate(
    { _id: session._id, status: "created" },
    { $set: { status: "processing", razorpayPaymentId: paymentId } },
    { new: true }
  );

  if (!claimed) {
    const fresh = await PaymentSession.findById(session._id);
    if (fresh?.status === "completed" && fresh.order) {
      return { status: "completed", order: await Order.findById(fresh.order) };
    }
    return { status: "processing", order: null };
  }

  const user = await User.findById(claimed.user);
  if (!user) {
    await refundAndClose(claimed, paymentId, "User account not found");
    throw ApiError.conflict("Your account could not be found. The payment will be refunded.");
  }

  // 3) Build the order from the FROZEN snapshot (not the live cart)
  try {
    const order = await createOrderFromSnapshot({
      user,
      snapshot: {
        items: claimed.items.map((i) => (i.toObject ? i.toObject() : i)),
        couponCode: claimed.couponCode,
        itemsPrice: claimed.itemsPrice,
        discountAmount: claimed.discountAmount,
        taxPrice: claimed.taxPrice,
        shippingPrice: claimed.shippingPrice,
        totalPrice: claimed.totalPrice,
      },
      shippingAddress: claimed.shippingAddress,
      paymentMethod: "razorpay",
      payment: {
        provider: "razorpay",
        razorpayOrderId: claimed.razorpayOrderId,
        razorpayPaymentId: paymentId,
        method: payment.method || "",
        amount: claimed.amount,
        currency: claimed.currency,
        capturedAt: new Date(),
      },
    });

    claimed.status = "completed";
    claimed.order = order._id;
    await claimed.save();

    await afterOrderPlaced({ user, order });
    return { status: "completed", order };
  } catch (err) {
    // Paid but we cannot fulfil (e.g. stock sold out meanwhile) -> refund automatically.
    console.error("[Payments] Fulfilment failed after capture, refunding:", err.message);
    await refundAndClose(claimed, paymentId, `Auto-refund: ${err.message}`);
    throw ApiError.conflict(
      `We could not complete your order (${err.message}). Your payment has been refunded automatically.`
    );
  }
};

const refundAndClose = async (session, paymentId, reason) => {
  try {
    const refund = await refundPayment({
      paymentId,
      amountPaise: session.amount,
      reason,
      orderId: session._id,
    });
    session.refundId = refund?.id || "";
  } catch (refundErr) {
    console.error("[Payments] AUTO-REFUND FAILED — manual refund required:", paymentId, refundErr?.error || refundErr?.message);
    session.failureReason = `REFUND FAILED (manual action needed): ${reason}`;
    session.status = "failed";
    await session.save();
    return;
  }
  session.status = "refunded";
  session.failureReason = reason;
  await session.save();
};

module.exports = {
  SESSION_TTL_MS,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  createRazorpaySession,
  finalizePaymentSession,
  refundPayment,
};
