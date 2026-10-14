const mongoose = require("mongoose");

const paymentEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, default: "" },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Keep the ledger for 90 days, then let MongoDB clean it up.
paymentEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("PaymentEvent", paymentEventSchema);
