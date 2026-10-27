const mongoose = require("mongoose");

const commissionRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ["global", "category", "seller"],
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    rateType: {
      type: String,
      enum: ["percentage", "fixed", "percentage_plus_fixed"],
      default: "percentage",
    },
    percentage: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
      max: 100,
    },
    fixedFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstOnCommissionRate: {
      type: Number,
      default: 18.0,
      min: 0,
      max: 100,
      comment: "18% GST levied on platform commission fees",
    },
    tcsRate: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 100,
      comment: "1% TCS deducted under Section 52 of CGST Act",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      index: true,
      comment: "Future or immediate date from which this commission percentage takes effect",
    },
    effectiveTo: {
      type: Date,
      default: null,
      index: true,
      comment: "Optional expiration date after which this tier no longer applies",
    },
    notificationSentAt: {
      type: Date,
      default: null,
    },
    notificationRecipientCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

commissionRuleSchema.index({ scope: 1, effectiveFrom: -1, isActive: 1 });

commissionRuleSchema.index({ scope: 1, isActive: 1 });
commissionRuleSchema.index({ category: 1, isActive: 1 });
commissionRuleSchema.index({ seller: 1, isActive: 1 });

module.exports = mongoose.model("CommissionRule", commissionRuleSchema);
