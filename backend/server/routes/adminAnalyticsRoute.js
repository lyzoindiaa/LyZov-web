const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRevenueByDay,
  getOrdersByStatus,
  getRecentOrders,
} = require("../controllers/adminAnalytics.controller");

const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Accessible by seller
router.get("/stats", protect, authorize("seller"), getDashboardStats);
router.get("/revenue", protect, authorize("seller"), getRevenueByDay);
router.get("/orders-status", protect, authorize("seller"), getOrdersByStatus);
router.get("/recent-orders", protect, authorize("seller"), getRecentOrders);

module.exports = router;
