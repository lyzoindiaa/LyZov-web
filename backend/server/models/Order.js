const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    hasSubOrders: {
      type: Boolean,
      default: false,
    },
    subOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubOrder",
      },
    ],
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      // "stripe" is LEGACY ONLY (historical orders). New orders can only be "razorpay" or "cod".
      enum: ["razorpay", "cod", "stripe"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["cod_pending", "captured", "refund_pending", "refunded", "partially_refunded", "failed"],
      default: "cod_pending",
    },
    payment: {
      provider: { type: String, default: "" },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      method: { type: String, default: "" },
      amount: { type: Number, default: 0 }, // paise
      currency: { type: String, default: "INR" },
      capturedAt: Date,
      refunds: [
        {
          refundId: String,
          amount: Number, // paise
          status: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Legacy Stripe payload (read-only, kept so historical orders still render).
    paymentResult: {
      id: { type: String },
      status: { type: String },
      currency: { type: String, default: "inr" },
      amount: { type: Number, default: 0 },
      amountReceived: { type: Number, default: 0 },
      updateTime: { type: String },
      email: { type: String },
    },
    // Set atomically by the winner of a cancel request so concurrent cancels can't double-restore stock/refund.
    cancellationClaimedAt: { type: Date, default: null },
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    trackingNumber: {
      type: String,
      default: "",
    },
    shippingPlatform: {
      type: String,
      default: "",
    },
    shippingPlatformLabel: {
      type: String,
      default: "",
    },
    trackingUrl: {
      type: String,
      default: "",
    },
    trackingAssignedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: String,
        note: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],
    cancelReason: {
      type: String,
      default: "",
    },
    returnStatus: {
      type: String,
      enum: ["Not Requested", "Requested", "Approved", "Rejected", "Picked Up", "Returned", "Refunded", "Exchanged"],
      default: "Not Requested"
    },
    returnReason: {
      type: String,
      default: ""
    },
    isExchange: {
      type: Boolean,
      default: false
    },
    exchangeDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

orderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    this.orderNumber =
      "NC-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
// A Razorpay payment/order can back at most one Order (blocks payment replay at the DB level).
orderSchema.index({ "payment.razorpayPaymentId": 1 }, { unique: true, sparse: true });
orderSchema.index({ "payment.razorpayOrderId": 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Order", orderSchema);
