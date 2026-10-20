const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  getAdminOverview,
  getSellers,
  getSellerById,
  inviteSeller,
  updateSeller,
  updateSellerStatus,
  updateSellerKyc,
  resendSellerInvite,
  getCustomers,
  updateCustomerStatus,
} = require("../controllers/adminController");

const {
  getDashboardStats,
  getRevenueByDay,
  getOrdersByStatus,
  getRecentOrders,
} = require("../controllers/adminAnalytics.controller");

// All admin routes require authentication and "admin" role
router.use(protect, authorize("admin"));

// ── Overview & Analytics ──
router.get("/overview", getAdminOverview);
router.get("/stats", getDashboardStats);
router.get("/revenue", getRevenueByDay);
router.get("/orders-status", getOrdersByStatus);
router.get("/recent-orders", getRecentOrders);

// ── Seller Management ──
router.get("/sellers", getSellers);
router.post("/sellers", inviteSeller);
router.get("/sellers/:id", getSellerById);
router.put("/sellers/:id", updateSeller);
router.put("/sellers/:id/status", updateSellerStatus);
router.put("/sellers/:id/kyc", updateSellerKyc);
router.post("/sellers/:id/resend-invite", resendSellerInvite);

// ── Customer Management ──
router.get("/customers", getCustomers);
router.put("/customers/:id/status", updateCustomerStatus);

module.exports = router;
