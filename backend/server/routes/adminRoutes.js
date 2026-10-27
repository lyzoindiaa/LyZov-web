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
  deleteCustomerAccount,
  deleteSellerAccount,
  getSellerKycDocument,
  getMarketplacePayouts,
  releaseSellerPayout,
  getMonthlySettlementSummary,
  exportMonthlySettlementCsv,
  releaseMonthlyBatch,
  triggerSettlementMaturityJob,
  getCommissionRules,
  createCommissionRule,
  updateCommissionRule,
  deleteCommissionRule,
  getProductModerationQueue,
  moderateProduct,
} = require("../controllers/adminController");

const {
  getDashboardStats,
  getRevenueByDay,
  getOrdersByStatus,
  getRecentOrders,
} = require("../controllers/adminAnalytics.controller");

// All routes require authentication
router.use(protect);

// ── Overview & Analytics (Scoped for sellers, global for superadmin) ──
router.get("/overview", authorize("admin"), getAdminOverview);
router.get("/stats", authorize("admin", "seller"), getDashboardStats);
router.get("/revenue", authorize("admin", "seller"), getRevenueByDay);
router.get("/orders-status", authorize("admin", "seller"), getOrdersByStatus);
router.get("/recent-orders", authorize("admin", "seller"), getRecentOrders);
router.get("/payouts", authorize("admin", "seller"), getMarketplacePayouts);

// ── SuperAdmin Protected Routes ──
router.use(authorize("admin"));

// ── Seller Management & KYC ──
router.get("/sellers", getSellers);
router.post("/sellers", inviteSeller);
router.get("/sellers/:id", getSellerById);
router.get("/sellers/:id/kyc-document/:docType", getSellerKycDocument);
router.put("/sellers/:id", updateSeller);
router.put("/sellers/:id/status", updateSellerStatus);
router.delete("/sellers/:id", deleteSellerAccount);
router.put("/sellers/:id/kyc", updateSellerKyc);
router.post("/sellers/:id/resend-invite", resendSellerInvite);

// ── Marketplace Financials & Payouts ──
router.post("/payouts/:id/release", releaseSellerPayout);
router.get("/payouts/monthly-summary", getMonthlySettlementSummary);
router.get("/payouts/export-neft", exportMonthlySettlementCsv);
router.post("/payouts/release-monthly-batch", releaseMonthlyBatch);
router.post("/payouts/run-maturity-job", triggerSettlementMaturityJob);

// ── Dynamic Commission Rules ──
router.get("/commission-rules", getCommissionRules);
router.post("/commission-rules", createCommissionRule);
router.put("/commission-rules/:id", updateCommissionRule);
router.delete("/commission-rules/:id", deleteCommissionRule);

// ── Product Moderation Queue ──
router.get("/products/moderation", getProductModerationQueue);
router.put("/products/:id/moderation", moderateProduct);

// ── Customer Management ──
router.get("/customers", getCustomers);
router.put("/customers/:id/status", updateCustomerStatus);
router.delete("/customers/:id", deleteCustomerAccount);

module.exports = router;
