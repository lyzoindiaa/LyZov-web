const mongoose = require("mongoose");

const snapshotItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    // Required so prepaid orders split into the correct seller sub-orders / payouts
    gstRate: { type: String, default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { _id: false }
);

/**
 * One PaymentSession == one Razorpay order. It stores the exact items, prices, coupon and
 * address that were priced server-side when the Razorpay order was created. Verification and the
 * webhook both finalize *this snapshot* into an Order, so later cart edits cannot change what was paid.
 */
const paymentSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["razorpay"], default: "razorpay" },

    razorpayOrderId: { type: String, required: true, unique: true },
    // Unique + sparse: a payment id can be bound to at most one session (blocks replay).
    razorpayPaymentId: { type: String, unique: true, sparse: true },

    amount: { type: Number, required: true, min: 100 }, // paise
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "processing", "completed", "refunded", "failed", "expired"],
      default: "created",
      index: true,
    },
    failureReason: { type: String, default: "" },
    lastPaymentError: { type: String, default: "" },

    items: { type: [snapshotItemSchema], required: true },
    shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
    couponCode: { type: String, default: null },
    itemsPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },

    fingerprint: { type: String, required: true }, // lets us reuse an unchanged open session
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    refundId: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

paymentSessionSchema.index({ user: 1, fingerprint: 1, status: 1 });

module.exports = mongoose.model("PaymentSession", paymentSessionSchema);
