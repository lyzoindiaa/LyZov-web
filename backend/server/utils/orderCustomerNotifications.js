const User = require("../models/User");
const emailService = require("../services/emailService");

/**
 * Resolve customer email + preferences for an order (registered user or guest checkout).
 */
async function loadCustomerContext(order) {
  let customer = null;
  const userRef = order.user || order.customer;
  if (userRef) {
    if (typeof userRef === "object" && userRef.email) {
      customer = userRef;
    } else if (typeof User.findById === "function") {
      const query = User.findById(userRef);
      if (query && typeof query.select === "function") {
        customer = await query.select("name email emailPreferences").lean();
      } else {
        customer = await query;
      }
    }
  }

  const email =
    customer?.email || order.paymentResult?.email || order.shippingAddress?.email;

  if (!email) return null;

  const recipientUser = {
    _id: customer?._id || userRef,
    name: customer?.name || order.shippingAddress?.fullName || "Valued Customer",
    email,
    emailPreferences: customer?.emailPreferences,
  };

  return { customer, recipientUser, email };
}

/**
 * Send order status / tracking update email to the customer (non-blocking friendly).
 */
async function emailCustomerOrderStatusUpdate(order, { newStatus, note, trackingNumber } = {}) {
  const orderNum = order.subOrderNumber || order.orderNumber;
  const ctx = await loadCustomerContext(order);
  if (!ctx) {
    console.warn(`[OrderEmail] Skipped status email — no recipient for order #${orderNum}`);
    return { success: false, skipped: true, reason: "no_email" };
  }

  const result = await emailService.sendOrderStatusUpdate({
    order,
    user: ctx.recipientUser,
    newStatus: newStatus || order.orderStatus,
    note,
    trackingNumber: trackingNumber !== undefined ? trackingNumber : order.trackingNumber,
  });

  if (result?.success && !result?.simulated) {
    console.log(`[OrderEmail] Status/tracking email sent for #${orderNum} → ${ctx.email}`);
  } else if (result?.simulated) {
    console.log(`[OrderEmail] Status email simulated for #${orderNum} → ${ctx.email}`);
  } else if (!result?.success) {
    console.error(
      `[OrderEmail] Failed status email for #${orderNum} → ${ctx.email}:`,
      result?.error || "unknown error"
    );
  }

  return result;
}

async function emailCustomerOrderCancelled(order, reason) {
  const orderNum = order.subOrderNumber || order.orderNumber;
  const ctx = await loadCustomerContext(order);
  if (!ctx) {
    console.warn(`[OrderEmail] Skipped cancellation email — no recipient for order #${orderNum}`);
    return { success: false, skipped: true, reason: "no_email" };
  }

  return emailService.sendOrderCancelled({
    order,
    user: ctx.recipientUser,
    reason,
  });
}

async function emailCustomerShipmentTracking(order, payload) {
  const orderNum = order.subOrderNumber || order.orderNumber;
  const ctx = await loadCustomerContext(order);
  if (!ctx) {
    console.warn(`[OrderEmail] Skipped shipment email — no recipient for order #${orderNum}`);
    return { success: false, skipped: true, reason: "no_email" };
  }

  return emailService.sendShipmentTrackingEmail({
    order,
    user: ctx.recipientUser,
    platformLabel: payload.platformLabel,
    trackingNumber: payload.trackingNumber,
    trackingUrl: payload.trackingUrl,
    emailBody: payload.emailBody,
    emailSubject: payload.emailSubject,
  });
}

async function emailCustomerOrderConfirmation(order) {
  const ctx = await loadCustomerContext(order);
  if (!ctx) {
    console.warn(`[OrderEmail] Skipped confirmation email — no recipient for order #${order.orderNumber}`);
    return { success: false, skipped: true, reason: "no_email" };
  }

  return emailService.sendOrderConfirmation({ order, user: ctx.recipientUser });
}

module.exports = {
  loadCustomerContext,
  emailCustomerOrderStatusUpdate,
  emailCustomerOrderCancelled,
  emailCustomerOrderConfirmation,
  emailCustomerShipmentTracking,
};
