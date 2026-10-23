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
  getSellerKycDocument,
  getMarketplacePayouts,
  releaseSellerPayout,
  getProductModerationQueue,
  moderateProduct,
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

// ── Seller Management & KYC ──
router.get("/sellers", getSellers);
router.post("/sellers", inviteSeller);
router.get("/sellers/:id", getSellerById);
router.get("/sellers/:id/kyc-document/:docType", getSellerKycDocument);
router.put("/sellers/:id", updateSeller);
router.put("/sellers/:id/status", updateSellerStatus);
router.put("/sellers/:id/kyc", updateSellerKyc);
router.post("/sellers/:id/resend-invite", resendSellerInvite);

// ── Marketplace Financials & Payouts ──
router.get("/payouts", getMarketplacePayouts);
router.post("/payouts/:id/release", releaseSellerPayout);

// ── Product Moderation Queue ──
router.get("/products/moderation", getProductModerationQueue);
router.put("/products/:id/moderation", moderateProduct);

// ── Customer Management ──
router.get("/customers", getCustomers);
router.put("/customers/:id/status", updateCustomerStatus);

module.exports = router;
