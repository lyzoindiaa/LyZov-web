const express = require("express");
const { body } = require("express-validator");
const {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
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
router.put("/:id/cancel", cancelOrder);

router.get("/", authorize("seller"), getAllOrders);
router.put(
  "/:id/status",
  authorize("seller"),
  [body("status").isIn(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"])],
  validate,
  updateOrderStatus
);

module.exports = router;
