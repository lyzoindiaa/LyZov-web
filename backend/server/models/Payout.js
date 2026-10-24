const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubOrder",
      required: true,
      index: true,
    },
    parentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 10,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    gstOnCommission: {
      type: Number,
      default: 0,
      min: 0,
      comment: "18% GST levied on platform commission fee",
    },
    tcsAmount: {
      type: Number,
      default: 0,
      min: 0,
      comment: "1% TCS deducted under Section 52 CGST Act",
    },
    shippingDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "cooling_off", "eligible", "processing", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    coolingOffStartedAt: Date,
    eligibleAt: {
      type: Date,
      comment: "Date when return/exchange window has passed and funds become eligible for release",
      index: true,
    },
    settlementPeriod: {
      type: String,
      default: "",
      index: true,
      comment: "Settlement month format e.g. YYYY-MM",
    },
    bankDetailsSnapshot: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    payoutMethod: {
      type: String,
      default: "bank_transfer",
    },
    transactionReference: {
      type: String,
      default: "",
    },
    utrNumber: {
      type: String,
      default: "",
      trim: true,
    },
    batchId: {
      type: String,
      default: "",
      index: true,
    },
    batchReleasedAt: Date,
    paidAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commissionRuleSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    failureReason: String,
    notes: String,
  },
  { timestamps: true }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payout", payoutSchema);
