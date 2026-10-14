/**
 * Audit script for legacy Stripe orders.
 * Lists all orders created with paymentMethod: 'stripe' that are currently paid or processing.
 *
 * Usage:
 *   node backend/server/scripts/audit-stripe-orders.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Order = require("../models/Order");

async function auditStripeOrders() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);

  try {
    const stripeOrders = await Order.find({ paymentMethod: "stripe" }).sort("-createdAt");
    console.log(`\nFound ${stripeOrders.length} legacy Stripe order(s):\n`);

    if (stripeOrders.length === 0) {
      console.log("No legacy Stripe orders found in the database. Safe to proceed with clean cut-over.");
      return;
    }

    let activeRefundableCount = 0;

    for (const order of stripeOrders) {
      const isActionable = order.isPaid && ["pending", "processing"].includes(order.orderStatus);
      if (isActionable) activeRefundableCount++;

      console.log(
        `Order #${order.orderNumber || order._id} | Status: ${order.orderStatus} | Paid: ${order.isPaid} | Amount: ₹${order.totalPrice} | Actionable: ${isActionable ? "YES (manual refund required if cancelled)" : "NO"}`
      );
    }

    console.log(`\nSummary: ${activeRefundableCount} actionable order(s) requiring manual dashboard attention if cancelled.`);
  } catch (err) {
    console.error("Error auditing orders:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

auditStripeOrders();
