require("dotenv").config();
const assert = require("node:assert");
const { test, describe } = require("node:test");
const mongoose = require("mongoose");

const Coupon = require("../models/Coupon");
const checkoutService = require("../services/checkoutService");

describe("Coupons & Promotional Campaigns Architecture Test Suite", () => {
  const sellerAId = new mongoose.Types.ObjectId();
  const sellerBId = new mongoose.Types.ObjectId();

  test("CPN-01: Scope & Seller Scoping Helper", () => {
    const platformCoupon = new Coupon({
      code: "PLATFORM20",
      scope: "platform",
      discountType: "percentage",
      discountValue: 20,
      validUntil: new Date(Date.now() + 86400000),
    });
    assert.strictEqual(platformCoupon.isSellerScoped(), false, "Platform coupon must not be seller-scoped");

    const sellerCoupon = new Coupon({
      code: "SELLERSTORE10",
      scope: "seller",
      seller: sellerAId,
      discountType: "flat",
      discountValue: 100,
      validUntil: new Date(Date.now() + 86400000),
    });
    assert.strictEqual(sellerCoupon.isSellerScoped(), true, "Seller coupon must be seller-scoped");
  });

  test("CPN-02: Seller-Scoped Coupon Eligibility Filtering", () => {
    const sellerCoupon = {
      code: "STOREA50",
      scope: "seller",
      seller: sellerAId,
      discountType: "percentage",
      discountValue: 10,
    };

    const items = [
      { product: new mongoose.Types.ObjectId(), seller: sellerAId, price: 1000, quantity: 2 }, // ₹2000
      { product: new mongoose.Types.ObjectId(), seller: sellerBId, price: 500, quantity: 1 },  // ₹500
    ];

    const eligibleSubtotal = checkoutService.getCouponEligibleSubtotal(items, sellerCoupon);
    assert.strictEqual(eligibleSubtotal, 2000, "Only Seller A items (₹2000) should be eligible for Seller A coupon");

    const totals = checkoutService.calculateTotals(items, sellerCoupon);
    // 10% of ₹2000 = ₹200 discount (NOT 10% of ₹2500)
    assert.strictEqual(totals.itemsPrice, 2500);
    assert.strictEqual(totals.discountAmount, 200);
    assert.strictEqual(totals.couponEligibleSubtotal, 2000);
  });

  test("CPN-03: Platform vs Seller Coupon Funding Allocation", () => {
    const sellerItemsMap = new Map();
    sellerItemsMap.set(sellerAId.toString(), [
      { seller: sellerAId, price: 1000, quantity: 2 }, // ₹2000
    ]);
    sellerItemsMap.set(sellerBId.toString(), [
      { seller: sellerBId, price: 1000, quantity: 1 }, // ₹1000
    ]);

    // Scenario A: Platform Coupon (Funded by Platform)
    const platformCoupon = { code: "BIGFESTIVE", scope: "platform", seller: null };
    const platformAllocation = checkoutService.allocateCouponDiscount({
      sellerItemsMap,
      itemsPrice: 3000,
      discountAmount: 300, // ₹300 total discount
      coupon: platformCoupon,
    });

    const allocA = platformAllocation.get(sellerAId.toString());
    const allocB = platformAllocation.get(sellerBId.toString());

    assert.strictEqual(allocA.fundedBy, "platform", "Platform coupon discount must be marked as platform funded");
    assert.strictEqual(allocB.fundedBy, "platform", "Platform coupon discount must be marked as platform funded");
    assert.strictEqual(allocA.amount, 200, "Seller A gets 2000/3000 * 300 = 200");
    assert.strictEqual(allocB.amount, 100, "Seller B gets 1000/3000 * 300 = 100");

    // Scenario B: Seller Coupon (Funded 100% by Issuing Seller)
    const sellerCoupon = { code: "STOREAOFFER", scope: "seller", seller: sellerAId };
    const sellerAllocation = checkoutService.allocateCouponDiscount({
      sellerItemsMap,
      itemsPrice: 3000,
      discountAmount: 200,
      coupon: sellerCoupon,
    });

    const allocASeller = sellerAllocation.get(sellerAId.toString());
    const allocBSeller = sellerAllocation.get(sellerBId.toString());

    assert.strictEqual(allocASeller.fundedBy, "seller", "Seller coupon discount must be funded by that seller");
    assert.strictEqual(allocASeller.amount, 200);
    assert.strictEqual(allocBSeller.amount, 0, "Non-issuing seller must absorb 0 discount");
  });

  test("CPN-04: Validity & Expiration Edge Cases", () => {
    const expiredCoupon = new Coupon({
      code: "OLDVOUCHER",
      isActive: true,
      validFrom: new Date(Date.now() - 200000),
      validUntil: new Date(Date.now() - 100000),
    });
    assert.strictEqual(expiredCoupon.isValid(), false, "Expired coupon must return isValid() === false");

    const futureCoupon = new Coupon({
      code: "FUTUREVOUCHER",
      isActive: true,
      validFrom: new Date(Date.now() + 100000),
      validUntil: new Date(Date.now() + 200000),
    });
    assert.strictEqual(futureCoupon.isValid(), false, "Future scheduled coupon must not be valid yet");

    const limitReached = new Coupon({
      code: "MAXEDOUT",
      isActive: true,
      validFrom: new Date(Date.now() - 100000),
      validUntil: new Date(Date.now() + 100000),
      usageLimit: 5,
      usedCount: 5,
    });
    assert.strictEqual(limitReached.isValid(), false, "Coupon that reached usageLimit must not be valid");
  });
});
