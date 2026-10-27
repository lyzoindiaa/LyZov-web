const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    usersUsed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * Ownership / funding model:
     *  - "platform": created by Super Admin, applies to the whole cart, discount is funded by the
     *    platform (seller payouts are computed on the pre-discount amount).
     *  - "seller":   created by a seller, applies ONLY to that seller's items in the cart, discount
     *    is funded by that seller (reduces their payout).
     */
    scope: {
      type: String,
      enum: ["platform", "seller"],
      default: "platform",
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

couponSchema.index({ scope: 1, seller: 1, createdAt: -1 });

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.validFrom || now > this.validUntil) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
};

/** True when the coupon only applies to one seller's products. */
couponSchema.methods.isSellerScoped = function () {
  return this.scope === "seller" && Boolean(this.seller);
};

module.exports = mongoose.model("Coupon", couponSchema);
