const express = require("express");
const { body } = require("express-validator");
const {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminCancelOrder,
  returnRequest,
  approveReturn,
  processExchange,
  getAllOrders,
  updateOrderStatus,
  sendTrackingEmail,
  getShipmentPlatforms,
  previewShipmentEmail,
  saveOrderShipment,
  notifyOrderShipment,
  trackOrderPublic,
} = require("../controllers/orderController");
const { protect, authorize, disallowRoles } = require("../middleware/authMiddleware");
const { requireProfileComplete } = require("../middleware/profileMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

// Public track order endpoint (no login required)
router.post(
  "/track-public",
  [
    body("orderNumber").trim().notEmpty().withMessage("Order number is required"),
    body("phoneOrEmail").trim().notEmpty().withMessage("Phone or Email is required"),
  ],
  validate,
  trackOrderPublic
);

router.use(protect);

router.post(
  "/create-payment-intent",
  disallowRoles("admin", "seller"),
  requireProfileComplete,
  createPaymentIntent
);

router.post(
  "/",
  disallowRoles("admin", "seller"),
  requireProfileComplete,
  [
    body("shippingAddress").isObject().withMessage("Shipping address is required"),
    body("paymentMethod").isIn(["cod"]).withMessage("Invalid payment method. Online payments must be made via /api/payments/razorpay"),
  ],
  validate,
  createOrder
);

// Admin & Seller order listing
router.get("/", authorize("seller"), getAllOrders);
router.get("/shipment/platforms", authorize("seller"), getShipmentPlatforms);

router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

// Customer cancel & return routes
router.put("/:id/cancel", cancelOrder);
router.post("/:id/cancel-request", cancelOrder);
router.post(
  "/:id/return-request",
  [body("reason").trim().notEmpty().withMessage("Return reason is required")],
  validate,
  returnRequest
);

// Admin & Seller order management routes
router.post("/:id/admin-cancel", authorize("seller"), adminCancelOrder);
router.post("/:id/approve-return", authorize("seller"), approveReturn);
router.post("/:id/process-exchange", authorize("seller"), processExchange);
router.put(
  "/:id/status",
  authorize("seller"),
  [
    body("status")
      .optional()
      .isIn(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])
      .withMessage("Invalid order status"),
    body("trackingNumber").optional().trim(),
    body("note").optional().trim(),
  ],
  validate,
  updateOrderStatus
);

router.post("/:id/send-tracking-email", authorize("seller"), sendTrackingEmail);
router.post("/:id/shipment/preview-email", authorize("seller"), previewShipmentEmail);
router.put(
  "/:id/shipment",
  authorize("seller"),
  [
    body("trackingNumber").trim().notEmpty().withMessage("Tracking number is required"),
    body("shippingPlatform").optional().trim(),
    body("trackingUrl").optional().trim(),
    body("markAsShipped").optional().isBoolean(),
  ],
  validate,
  saveOrderShipment
);
router.post(
  "/:id/shipment/notify",
  authorize("seller"),
  [
    body("trackingNumber").trim().notEmpty().withMessage("Tracking number is required"),
    body("emailBody").trim().notEmpty().withMessage("Email body is required"),
    body("emailSubject").optional().trim(),
    body("shippingPlatform").optional().trim(),
    body("trackingUrl").optional().trim(),
    body("markAsShipped").optional().isBoolean(),
    body("sendInAppNotification").optional().isBoolean(),
  ],
  validate,
  notifyOrderShipment
);

module.exports = router;
