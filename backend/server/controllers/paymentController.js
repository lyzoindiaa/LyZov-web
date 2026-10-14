const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const { getKeyId, getWebhookSecret } = require("../config/razorpay");
const PaymentSession = require("../models/PaymentSession");
const PaymentEvent = require("../models/PaymentEvent");
const Order = require("../models/Order");
const { pickShippingAddress, assertShippingAddress } = require("../services/checkoutService");
const {
  verifyCheckoutSignature,
  verifyWebhookSignature,
  createRazorpaySession,
  finalizePaymentSession,
} = require("../services/paymentService");

// @desc    Create or reuse a Razorpay order session for current cart
// @route   POST /api/payments/razorpay/order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const shippingAddress = pickShippingAddress(req.body.shippingAddress);
  assertShippingAddress(shippingAddress);

  const session = await createRazorpaySession({
    user: req.user,
    shippingAddress,
  });

  return sendSuccess(res, 200, "Payment session created", {
    keyId: getKeyId(),
    razorpayOrderId: session.razorpayOrderId,
    amount: session.amount, // in paise
    currency: session.currency,
    sessionId: session._id,
    orderSummary: {
      totalPrice: session.totalPrice,
      itemsPrice: session.itemsPrice,
      discountAmount: session.discountAmount,
      shippingPrice: session.shippingPrice,
      taxPrice: session.taxPrice,
      itemsCount: session.items.length,
    },
    prefill: {
      name: shippingAddress.fullName || req.user.name || "",
      email: req.user.email || "",
      contact: shippingAddress.phone || req.user.phone || "",
    },
  });
});

// @desc    Verify Razorpay checkout signature and finalize the order
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest("Missing required Razorpay payment verification fields");
  }

  const isValidSignature = verifyCheckoutSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValidSignature) {
    throw ApiError.badRequest("Payment signature verification failed. Please contact support if amount was deducted.");
  }

  const session = await PaymentSession.findOne({
    razorpayOrderId: razorpay_order_id,
    user: req.user._id,
  });

  if (!session) {
    throw ApiError.notFound("Payment session not found or does not belong to the current user");
  }

  const result = await finalizePaymentSession({
    session,
    paymentId: razorpay_payment_id,
  });

  return sendSuccess(res, 200, "Payment verified and order placed successfully", {
    orderId: result.order?._id,
    orderNumber: result.order?.orderNumber,
    status: result.status,
  });
});

// @desc    Poll payment session status (fallback for slow webhooks / tab closed)
// @route   GET /api/payments/session/:sessionId/status
// @access  Private
const getPaymentSessionStatus = asyncHandler(async (req, res) => {
  const session = await PaymentSession.findOne({
    _id: req.params.sessionId,
    user: req.user._id,
  });

  if (!session) {
    throw ApiError.notFound("Payment session not found");
  }

  let orderNumber = null;
  if (session.order) {
    const order = await Order.findById(session.order).select("orderNumber");
    orderNumber = order?.orderNumber;
  }

  return sendSuccess(res, 200, "Payment session status retrieved", {
    status: session.status,
    orderId: session.order,
    orderNumber,
    failureReason: session.failureReason,
  });
});

// @desc    Razorpay Webhook listener (idempotent, server-to-server)
// @route   POST /api/payments/razorpay/webhook
// @access  Public (verified via Razorpay HMAC signature)
const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];
  const webhookSecret = getWebhookSecret();

  if (!webhookSecret) {
    console.warn("[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured; skipping webhook");
    return res.status(200).json({ status: "ignored_unconfigured" });
  }

  // Use rawBody buffer captured before json parsing
  const rawBody = req.rawBody || JSON.stringify(req.body);
  const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

  if (!isValid) {
    console.error("[Razorpay Webhook] Invalid webhook signature received");
    throw ApiError.unauthorized("Invalid webhook signature");
  }

  const event = req.body;
  const eventType = event.event;

  // Deduplication check
  if (eventId) {
    try {
      await PaymentEvent.create({
        eventId,
        type: eventType,
        razorpayOrderId: event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id || "",
        razorpayPaymentId: event.payload?.payment?.entity?.id || "",
      });
    } catch (err) {
      if (err.code === 11000) {
        // Event already processed
        return res.status(200).json({ status: "duplicate_ignored" });
      }
      throw err;
    }
  }

  const paymentEntity = event.payload?.payment?.entity;

  if (eventType === "payment.captured" || eventType === "order.paid") {
    const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
    const paymentId = paymentEntity?.id;

    if (orderId && paymentId) {
      const session = await PaymentSession.findOne({ razorpayOrderId: orderId });
      if (session && session.status !== "completed") {
        await finalizePaymentSession({ session, paymentId }).catch((err) => {
          console.error("[Razorpay Webhook] Error finalizing payment:", err.message);
        });
      }
    }
  } else if (eventType === "payment.failed") {
    const orderId = paymentEntity?.order_id;
    if (orderId) {
      const session = await PaymentSession.findOne({ razorpayOrderId: orderId });
      if (session && session.status === "created") {
        session.lastPaymentError = paymentEntity?.error_description || "Payment failed";
        await session.save();
      }
    }
  }

  return res.status(200).json({ status: "processed" });
});

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentSessionStatus,
  handleRazorpayWebhook,
};
