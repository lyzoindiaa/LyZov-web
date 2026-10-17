const express = require("express");
const { body } = require("express-validator");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentSessionStatus,
  handleRazorpayWebhook,
} = require("../controllers/paymentController");
const { protect, disallowRoles } = require("../middleware/authMiddleware");
const { requireProfileComplete } = require("../middleware/profileMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

// Webhook listener - public (signature verified inside handler)
router.post("/razorpay/webhook", handleRazorpayWebhook);

// Protected routes (require user login and complete profile)
router.use(protect);

router.post(
  "/razorpay/order",
  disallowRoles("admin", "seller"),
  requireProfileComplete,
  [body("shippingAddress").isObject().withMessage("Valid shipping address is required")],
  validate,
  createRazorpayOrder
);

router.post(
  "/razorpay/verify",
  disallowRoles("admin", "seller"),
  requireProfileComplete,
  [
    body("razorpay_order_id").trim().notEmpty().withMessage("Razorpay order ID is required"),
    body("razorpay_payment_id").trim().notEmpty().withMessage("Razorpay payment ID is required"),
    body("razorpay_signature").trim().notEmpty().withMessage("Razorpay signature is required"),
  ],
  validate,
  verifyRazorpayPayment
);

router.get("/session/:sessionId/status", getPaymentSessionStatus);

module.exports = router;
