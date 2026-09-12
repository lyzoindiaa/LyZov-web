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
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { requireProfileComplete } = require("../middleware/profileMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.post("/create-payment-intent", requireProfileComplete, createPaymentIntent);

router.post(
  "/",
  requireProfileComplete,
  [
    body("shippingAddress").isObject().withMessage("Shipping address is required"),
    body("paymentMethod").isIn(["stripe", "cod"]).withMessage("Invalid payment method"),
  ],
  validate,
  createOrder
);

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
router.get("/", authorize("seller"), getAllOrders);
router.post("/:id/admin-cancel", authorize("seller"), adminCancelOrder);
router.post("/:id/approve-return", authorize("seller"), approveReturn);
router.post("/:id/process-exchange", authorize("seller"), processExchange);
router.put(
  "/:id/status",
  authorize("seller"),
  [body("status").isIn(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])],
  validate,
  updateOrderStatus
);

module.exports = router;
