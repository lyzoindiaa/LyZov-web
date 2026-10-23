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
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "eligible", "processing", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    eligibleAt: {
      type: Date,
      comment: "Date when return/exchange window has passed and funds become eligible for release",
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
    paidAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    failureReason: String,
    notes: String,
  },
  { timestamps: true }
);

payoutSchema.index({ seller: 1, status: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payout", payoutSchema);
