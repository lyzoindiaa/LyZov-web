/**
 * E2E Full Marketplace Database & API Verification Test Suite
 * Connects directly to the live server (http://localhost:5000) and live MongoDB database
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const assert = require("node:assert");
const { test, describe, before, after } = require("node:test");
const mongoose = require("mongoose");

const BASE_URL = "http://localhost:5000/api";

let adminToken = "";
let sellerToken = "";
let customerToken = "";
let sellerUserId = "";
let customerUserId = "";

let testBrandId = "";
let testCategoryId = "";
let testCommissionRuleId = "";
let testProductId = "";
let testOrderId = "";
let testSubOrderId = "";
let testPayoutId = "";

async function apiRequest(endpoint, { method = "GET", token = null, body = null } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // raw text like CSV
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

describe("E2E Full Marketplace Verification (Live DB Connected)", () => {
  before(async () => {
    const connectDB = require("../config/db");
    await connectDB();
  });

  after(async () => {
    // Clean up test documents created during testing
    try {
      const Brand = require("../models/Brand");
      const Category = require("../models/Category");
      const Product = require("../models/Product");
      const CommissionRule = require("../models/CommissionRule");
      const Order = require("../models/Order");
      const SubOrder = require("../models/SubOrder");
      const Payout = require("../models/Payout");

      if (testBrandId) await Brand.findByIdAndDelete(testBrandId);
      if (testCategoryId) await Category.findByIdAndDelete(testCategoryId);
      if (testCommissionRuleId) await CommissionRule.findByIdAndDelete(testCommissionRuleId);
      if (testProductId) await Product.findByIdAndDelete(testProductId);
      if (testOrderId) await Order.findByIdAndDelete(testOrderId);
      if (testSubOrderId) await SubOrder.findByIdAndDelete(testSubOrderId);
      if (testPayoutId) await Payout.findByIdAndDelete(testPayoutId);
    } catch (e) {
      console.error("Cleanup error:", e.message);
    }
  });

  /* ─────────────────────────────────────────────────────────────
     1. Authentication & Role-Based Access Control
  ───────────────────────────────────────────────────────────── */
  test("E2E-01: Authenticate SuperAdmin, Verified Seller, and Customer", async () => {
    // Admin login
    const adminRes = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "lyzovadmin@gmail.com", password: "LyZovAdmin@2025" },
    });
    assert.strictEqual(adminRes.status, 200, "SuperAdmin login must return 200 OK");
    assert.strictEqual(adminRes.data.success, true);
    assert.strictEqual(adminRes.data.data.user.role, "admin");
    adminToken = adminRes.data.data.accessToken;
    assert.ok(adminToken, "Admin access token must be present");

    // Seller login
    const sellerRes = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "seller@lyzov.com", password: "Seller@1234" },
    });
    assert.strictEqual(sellerRes.status, 200, "Seller login must return 200 OK");
    assert.strictEqual(sellerRes.data.data.user.role, "seller");
    sellerToken = sellerRes.data.data.accessToken;
    sellerUserId = sellerRes.data.data.user._id;
    assert.ok(sellerToken, "Seller access token must be present");

    // Customer login
    const customerRes = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "customer@lyzov.com", password: "Customer@1234" },
    });
    assert.strictEqual(customerRes.status, 200, "Customer login must return 200 OK");
    assert.strictEqual(customerRes.data.data.user.role, "customer");
    customerToken = customerRes.data.data.accessToken;
    customerUserId = customerRes.data.data.user._id;
    assert.ok(customerToken, "Customer access token must be present");

    const User = require("../models/User");
    await User.findByIdAndUpdate(customerUserId, {
      $set: { profileComplete: true, isActive: true, isDeleted: false },
    });
  });

  /* ─────────────────────────────────────────────────────────────
     2. Brand Governance
  ───────────────────────────────────────────────────────────── */
  test("E2E-02: Brand Governance - Seller Can Create, Cannot Edit/Delete; SuperAdmin Controls", async () => {
    const brandName = `E2E Brand ${Date.now()}`;

    // 1. Seller creates brand
    const createRes = await apiRequest("/brands", {
      method: "POST",
      token: sellerToken,
      body: { name: brandName, description: "Test brand by seller" },
    });
    assert.strictEqual(createRes.status, 201, "Seller must be allowed to create brand");
    testBrandId = createRes.data.data._id;
    assert.ok(testBrandId);

    // 2. Seller tries to edit brand -> 403 Forbidden
    const sellerEditRes = await apiRequest(`/brands/${testBrandId}`, {
      method: "PUT",
      token: sellerToken,
      body: { name: `${brandName} Edited By Seller` },
    });
    assert.strictEqual(sellerEditRes.status, 403, "Seller must NOT be allowed to edit brand (403)");

    // 3. Seller tries to delete brand -> 403 Forbidden
    const sellerDeleteRes = await apiRequest(`/brands/${testBrandId}`, {
      method: "DELETE",
      token: sellerToken,
    });
    assert.strictEqual(sellerDeleteRes.status, 403, "Seller must NOT be allowed to delete brand (403)");

    // 4. SuperAdmin can edit brand -> 200 OK
    const adminEditRes = await apiRequest(`/brands/${testBrandId}`, {
      method: "PUT",
      token: adminToken,
      body: { name: `${brandName} Verified` },
    });
    assert.strictEqual(adminEditRes.status, 200, "SuperAdmin must be allowed to edit brand");
    assert.strictEqual(adminEditRes.data.data.name, `${brandName} Verified`);
  });

  /* ─────────────────────────────────────────────────────────────
     3. Category Governance
  ───────────────────────────────────────────────────────────── */
  test("E2E-03: Category Governance - Seller Can Create, Cannot Edit/Delete; SuperAdmin Controls", async () => {
    const catName = `E2E Cat ${Date.now()}`;

    // 1. Seller creates category
    const createRes = await apiRequest("/categories", {
      method: "POST",
      token: sellerToken,
      body: { name: catName, description: "Test category created by seller" },
    });
    assert.strictEqual(createRes.status, 201, "Seller must be allowed to create category");
    testCategoryId = createRes.data.data._id;
    assert.ok(testCategoryId);

    // 2. Seller tries to edit category -> 403 Forbidden
    const sellerEditRes = await apiRequest(`/categories/${testCategoryId}`, {
      method: "PUT",
      token: sellerToken,
      body: { name: `${catName} Seller Edit` },
    });
    assert.strictEqual(sellerEditRes.status, 403, "Seller must NOT be allowed to edit category (403)");

    // 3. Seller tries to delete category -> 403 Forbidden
    const sellerDeleteRes = await apiRequest(`/categories/${testCategoryId}`, {
      method: "DELETE",
      token: sellerToken,
    });
    assert.strictEqual(sellerDeleteRes.status, 403, "Seller must NOT be allowed to delete category (403)");

    // 4. SuperAdmin can edit category -> 200 OK
    const adminEditRes = await apiRequest(`/categories/${testCategoryId}`, {
      method: "PUT",
      token: adminToken,
      body: { name: `${catName} SuperAdmin Approved` },
    });
    assert.strictEqual(adminEditRes.status, 200, "SuperAdmin must be allowed to edit category");
    assert.strictEqual(adminEditRes.data.data.name, `${catName} SuperAdmin Approved`);
  });

  /* ─────────────────────────────────────────────────────────────
     4. Commission Governance Rules
  ───────────────────────────────────────────────────────────── */
  test("E2E-04: SuperAdmin Creates Tiered Commission Rule for Category", async () => {
    const ruleRes = await apiRequest("/admin/commission-rules", {
      method: "POST",
      token: adminToken,
      body: {
        name: "E2E Apparel 12% Tier",
        scope: "category",
        category: testCategoryId,
        percentage: 12,
        fixedFee: 10,
        gstOnCommissionRate: 18.0,
        tcsRate: 1.0,
        description: "12% category commission rule with ₹10 fixed fee",
      },
    });

    assert.strictEqual(ruleRes.status, 201, "SuperAdmin must be able to create commission rule");
    testCommissionRuleId = ruleRes.data.data._id;
    assert.strictEqual(ruleRes.data.data.percentage, 12);
    assert.strictEqual(ruleRes.data.data.fixedFee, 10);
    assert.strictEqual(ruleRes.data.data.gstOnCommissionRate, 18);
    assert.strictEqual(ruleRes.data.data.tcsRate, 1);

    // Verify in rules list
    const listRes = await apiRequest("/admin/commission-rules", {
      method: "GET",
      token: adminToken,
    });
    assert.strictEqual(listRes.status, 200);
    const found = listRes.data.data.find((r) => r._id === testCommissionRuleId);
    assert.ok(found, "Newly created commission rule must be in rules list");
  });

  /* ─────────────────────────────────────────────────────────────
     5. Seller Product Catalog Creation
  ───────────────────────────────────────────────────────────── */
  test("E2E-05: Seller Creates Product Under Managed Brand & Category", async () => {
    const Product = require("../models/Product");

    const product = await Product.create({
      title: `E2E Jaipur Handloom Shirt ${Date.now()}`,
      description: "Fine organic cotton handcrafted shirt",
      price: 1000,
      discountPrice: 900,
      stock: 50,
      category: testCategoryId,
      brand: testBrandId,
      seller: sellerUserId,
      isActive: true,
      moderationStatus: "approved",
      images: [{ url: "https://placehold.co/400x400.png", publicId: "test_e2e_img" }],
    });

    testProductId = product._id.toString();
    assert.ok(testProductId);
    assert.strictEqual(product.price, 1000);
    assert.strictEqual(product.discountPrice, 900);
  });

  /* ─────────────────────────────────────────────────────────────
     6. Checkout & SubOrder Splitting with Dynamic Commission Math
  ───────────────────────────────────────────────────────────── */
  test("E2E-06: Customer Checkout Computes Dynamic 12% Commission + GST + TCS", async () => {
    // 0. Clear cart first to ensure clean state
    await apiRequest("/cart", { method: "DELETE", token: customerToken });

    // 1. Add item to cart
    const addCartRes = await apiRequest("/cart/items", {
      method: "POST",
      token: customerToken,
      body: { productId: testProductId, quantity: 2 },
    });
    assert.strictEqual(addCartRes.status, 200, "Adding to cart must succeed");

    // 2. Place COD order
    const orderRes = await apiRequest("/orders", {
      method: "POST",
      token: customerToken,
      body: {
        paymentMethod: "cod",
        shippingAddress: {
          fullName: "Rahul Sharma",
          phone: "9123456789",
          addressLine1: "B-42, Malviya Nagar",
          city: "Jaipur",
          state: "Rajasthan",
          postalCode: "302017",
          country: "India",
        },
      },
    });

    assert.strictEqual(orderRes.status, 201, `Placing order must succeed (201 Created): ${JSON.stringify(orderRes.data)}`);
    const orderData = orderRes.data.data;
    testOrderId = orderData._id;

    // Verify SubOrder
    const SubOrder = require("../models/SubOrder");
    const subOrders = await SubOrder.find({ parentOrder: testOrderId });
    assert.strictEqual(subOrders.length, 1, "Exactly one SubOrder must be generated for the seller");
    const subOrder = subOrders[0];
    testSubOrderId = subOrder._id.toString();

    // 2 items @ discountPrice ₹900 = ₹1,800 itemsPrice
    assert.strictEqual(subOrder.itemsPrice, 1800);
    assert.strictEqual(subOrder.commissionRate, 12, "Commission rate must match the category rule (12%)");

    // Math verification:
    // Base commission = (1800 * 12 / 100) + 10 (fixed fee) = 216 + 10 = ₹226
    assert.strictEqual(subOrder.commissionAmount, 226, "Commission = 216 + 10 = 226");
    // GST on commission = 226 * 18% = ₹40.68
    assert.strictEqual(subOrder.gstOnCommission, 40.68, "18% GST on 226 is 40.68");
    // TCS = 1800 * 1% = ₹18.00
    assert.strictEqual(subOrder.tcsAmount, 18, "1% TCS on 1800 is 18.00");
    // Total deductions = 226 + 40.68 + 18 = ₹284.68
    // Net seller earnings = 1800 - 284.68 = ₹1,515.32
    assert.strictEqual(subOrder.sellerEarnings, 1515.32, "Net earnings = 1800 - 284.68 = 1515.32");
    assert.strictEqual(subOrder.payoutStatus, "pending", "Initial payout status must be pending");

    // Verify linked Payout record
    const Payout = require("../models/Payout");
    const payout = await Payout.findOne({ subOrder: testSubOrderId });
    assert.ok(payout, "Linked Payout record must be created");
    testPayoutId = payout._id.toString();
    assert.strictEqual(payout.status, "pending");
    assert.strictEqual(payout.netAmount, 1515.32);
    assert.strictEqual(payout.gstOnCommission, 40.68);
    assert.strictEqual(payout.tcsAmount, 18);
  });

  /* ─────────────────────────────────────────────────────────────
     7. Delivery Hook & 7-Day Cooling Off Period
  ───────────────────────────────────────────────────────────── */
  test("E2E-07: Seller Marks SubOrder Delivered -> Transitions to Cooling-Off (7d)", async () => {
    const updateRes = await apiRequest(`/orders/${testSubOrderId}/status`, {
      method: "PUT",
      token: sellerToken,
      body: { status: "delivered", note: "Package hand-delivered with OTP" },
    });

    assert.strictEqual(updateRes.status, 200, "Updating suborder to delivered must succeed");

    const SubOrder = require("../models/SubOrder");
    const Payout = require("../models/Payout");

    const subOrder = await SubOrder.findById(testSubOrderId);
    assert.strictEqual(subOrder.orderStatus, "delivered");
    assert.strictEqual(subOrder.isDelivered, true);
    assert.strictEqual(subOrder.payoutStatus, "cooling_off");
    assert.ok(subOrder.coolingOffUntil instanceof Date);

    const payout = await Payout.findById(testPayoutId);
    assert.strictEqual(payout.status, "cooling_off");
    assert.ok(payout.coolingOffStartedAt instanceof Date);
    assert.ok(payout.eligibleAt instanceof Date);

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const diff = payout.eligibleAt.getTime() - payout.coolingOffStartedAt.getTime();
    assert.strictEqual(diff, sevenDaysMs, "Cooling-off window must be exactly 7 days");
  });

  /* ─────────────────────────────────────────────────────────────
     8. Settlement Maturity Worker
  ───────────────────────────────────────────────────────────── */
  test("E2E-08: Settlement Maturity Worker Promotes Expired Cooling-Off to Eligible", async () => {
    const Payout = require("../models/Payout");

    // Fast-forward eligibleAt to the past (simulating 7 days elapsed)
    await Payout.findByIdAndUpdate(testPayoutId, {
      $set: { eligibleAt: new Date(Date.now() - 5000) },
    });

    // Run maturity job via SuperAdmin API
    const matureRes = await apiRequest("/admin/payouts/run-maturity-job", {
      method: "POST",
      token: adminToken,
    });

    assert.strictEqual(matureRes.status, 200);
    assert.ok(matureRes.data.data.promotedCount >= 1, "Must promote at least 1 matured payout");

    const SubOrder = require("../models/SubOrder");
    const updatedPayout = await Payout.findById(testPayoutId);
    const updatedSubOrder = await SubOrder.findById(testSubOrderId);

    assert.strictEqual(updatedPayout.status, "eligible", "Payout must now be eligible for disbursement");
    assert.strictEqual(updatedSubOrder.payoutStatus, "eligible", "SubOrder payoutStatus must be eligible");
  });

  /* ─────────────────────────────────────────────────────────────
     9. Monthly Settlement Summary & RBI NEFT CSV Export
  ───────────────────────────────────────────────────────────── */
  test("E2E-09: SuperAdmin Fetches Monthly Summary & Exports Bulk NEFT CSV", async () => {
    // 1. Monthly summary
    const summaryRes = await apiRequest("/admin/payouts/monthly-summary", {
      method: "GET",
      token: adminToken,
    });

    assert.strictEqual(summaryRes.status, 200);
    const batches = summaryRes.data.data;
    assert.ok(Array.isArray(batches));
    const sellerBatch = batches.find((b) => b.sellerId === sellerUserId);
    assert.ok(sellerBatch, "Seller batch must be present in monthly settlement summary");
    assert.ok(sellerBatch.totalNet >= 1515.32);
    assert.strictEqual(sellerBatch.hasPendingEligible, true);

    // 2. Export NEFT CSV
    const csvRes = await apiRequest("/admin/payouts/export-neft", {
      method: "GET",
      token: adminToken,
    });

    assert.strictEqual(csvRes.status, 200);
    const csvString = typeof csvRes.data === "string" ? csvRes.data : JSON.stringify(csvRes.data);
    assert.ok(csvString.includes("Beneficiary Name"), "CSV must have Beneficiary Name header");
    assert.ok(csvString.includes("Account Number"), "CSV must have Account Number header");
    assert.ok(csvString.includes("IFSC Code"), "CSV must have IFSC Code header");
    assert.ok(csvString.includes("Jaipur Craft Atelier"), "CSV must include seller business name");
  });

  /* ─────────────────────────────────────────────────────────────
     10. Monthly Batch Disbursement with Bank UTR Reference
  ───────────────────────────────────────────────────────────── */
  test("E2E-10: SuperAdmin Releases Monthly Batch with Bank UTR Reference", async () => {
    const utr = `UTR-HDFC-${Date.now()}`;

    const releaseRes = await apiRequest("/admin/payouts/release-monthly-batch", {
      method: "POST",
      token: adminToken,
      body: {
        sellerId: sellerUserId,
        utrNumber: utr,
        notes: "Monthly settlement released via HDFC Corporate Portal",
      },
    });

    assert.strictEqual(releaseRes.status, 200, "Releasing monthly batch must succeed");
    assert.ok(releaseRes.data.data.releasedCount >= 1);
    assert.strictEqual(releaseRes.data.data.utrNumber, utr);

    const Payout = require("../models/Payout");
    const SubOrder = require("../models/SubOrder");

    const payout = await Payout.findById(testPayoutId);
    assert.strictEqual(payout.status, "completed", "Payout status must be completed");
    assert.strictEqual(payout.utrNumber, utr);
    assert.ok(payout.paidAt instanceof Date);

    const subOrder = await SubOrder.findById(testSubOrderId);
    assert.strictEqual(subOrder.payoutStatus, "paid", "SubOrder payoutStatus must be paid");
  });

  /* ─────────────────────────────────────────────────────────────
     11. Seller Financials Isolation & Wallet Verification
  ───────────────────────────────────────────────────────────── */
  test("E2E-11: Seller Portal Shows Tenant-Isolated Metrics & Disbursed Balance", async () => {
    const sellerLedgerRes = await apiRequest("/admin/payouts", {
      method: "GET",
      token: sellerToken,
    });

    assert.strictEqual(sellerLedgerRes.status, 200);
    const { financials, payouts } = sellerLedgerRes.data.meta ? { financials: sellerLedgerRes.data.meta.financials, payouts: sellerLedgerRes.data.data } : {};

    assert.ok(financials.paidBalance >= 1515.32, "Paid balance must reflect completed disbursement");
    // Verify tenant isolation: all returned payouts must belong to this seller
    const allBelong = payouts.every((p) => p.seller._id === sellerUserId || p.seller === sellerUserId);
    assert.strictEqual(allBelong, true, "Seller must ONLY see their own payouts");
  });

  /* ─────────────────────────────────────────────────────────────
     12. Permanent Account Deletion & Email Blacklist
  ───────────────────────────────────────────────────────────── */
  test("E2E-12: Permanent Customer Deletion & Email Blacklisting", async () => {
    const User = require("../models/User");
    const tempEmail = `e2e_blacklisted_${Date.now()}@test.com`;

    // 1. Create a temporary user
    const tempUser = await User.create({
      name: "Temporary User",
      email: tempEmail,
      password: "TempPassword@123",
      role: "customer",
      isActive: true,
      isEmailVerified: true,
    });

    // 2. SuperAdmin permanently deletes account
    const deleteRes = await apiRequest(`/admin/customers/${tempUser._id}`, {
      method: "DELETE",
      token: adminToken,
      body: { reason: "Terms of service violation - fraud protection" },
    });

    assert.strictEqual(deleteRes.status, 200, "Account deletion must succeed");

    // 3. User attempts to register with same email -> 403 Forbidden
    const reRegisterRes = await apiRequest("/auth/register", {
      method: "POST",
      body: {
        name: "Fraudulent Impersonator",
        email: tempEmail,
        password: "NewPassword@123",
      },
    });
    assert.strictEqual(reRegisterRes.status, 403, "Re-registration with blacklisted email must return 403");
    assert.ok(
      reRegisterRes.data.message.includes("terminated") ||
        reRegisterRes.data.message.includes("cannot be re-registered"),
      "Error message must specify email is terminated/cannot be re-registered"
    );

    // 4. User attempts to login -> 403 Forbidden
    const reLoginRes = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: tempEmail, password: "TempPassword@123" },
    });
    assert.strictEqual(reLoginRes.status, 403, "Login with terminated account must return 403");
    assert.ok(
      reLoginRes.data.message.includes("terminated"),
      "Error message must specify account was terminated"
    );
  });
});
