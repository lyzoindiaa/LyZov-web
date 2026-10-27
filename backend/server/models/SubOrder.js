const mongoose = require("mongoose");

const subOrderItemSchema = new mongoose.Schema(
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
    gstRate: { type: String, default: null },
  },
  { _id: true }
);

const subOrderSchema = new mongoose.Schema(
  {
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    subOrderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: [subOrderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod", "stripe"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["cod_pending", "captured", "refund_pending", "refunded", "partially_refunded", "failed"],
      default: "cod_pending",
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    // Coupon funding split: platform coupons are added back to seller earnings, seller coupons are not
    couponFundedBy: { type: String, enum: ["none", "platform", "seller"], default: "none" },
    platformFundedDiscount: { type: Number, default: 0, min: 0 },
    sellerFundedDiscount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, default: 0 },

    // Financial settlements
    commissionRate: { type: Number, default: 10, min: 0, max: 100 }, // Percentage e.g. 10%
    commissionAmount: { type: Number, default: 0, min: 0 },
    gstOnCommission: { type: Number, default: 0, min: 0 },
    tcsAmount: { type: Number, default: 0, min: 0 },
    sellerEarnings: { type: Number, default: 0, min: 0 },
    settlementPeriod: { type: String, default: "" },
    coolingOffUntil: { type: Date, default: null },
    payoutStatus: {
      type: String,
      enum: ["pending", "cooling_off", "eligible", "processing", "paid", "refunded"],
      default: "pending",
      index: true,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
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
    cancellationClaimedAt: {
      type: Date,
      default: null,
    },
    returnStatus: {
      type: String,
      enum: ["Not Requested", "Requested", "Approved", "Rejected", "Picked Up", "Returned", "Refunded", "Exchanged"],
      default: "Not Requested",
    },
    returnReason: {
      type: String,
      default: "",
    },
    isExchange: {
      type: Boolean,
      default: false,
    },
    exchangeDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

subOrderSchema.index({ seller: 1, createdAt: -1 });
subOrderSchema.index({ seller: 1, orderStatus: 1 });
subOrderSchema.index({ parentOrder: 1, seller: 1 });

module.exports = mongoose.model("SubOrder", subOrderSchema);
