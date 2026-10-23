require("dotenv").config();
const assert = require("node:assert");
const { test, describe, beforeEach } = require("node:test");
const mongoose = require("mongoose");

// Disable mongoose buffering so unmocked DB calls fail fast instead of hanging
mongoose.set("bufferCommands", false);

// Import models, controllers, and middleware
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const SubOrder = require("../models/SubOrder");
const Payout = require("../models/Payout");
const { requireVerifiedSeller, authorize } = require("../middleware/authMiddleware");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const adminController = require("../controllers/adminController");
const checkoutService = require("../services/checkoutService");
const stockService = require("../services/stockService");

// Mock Express req, res, next helper
function createMockReqRes({ user, params = {}, body = {}, query = {} } = {}) {
  const req = {
    user: user || { _id: new mongoose.Types.ObjectId(), role: "customer" },
    params,
    body,
    query,
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getResponseData() {
      return responseData;
    },
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next };
}

describe("Multi-Seller Marketplace Architecture & Isolation Test Suite", () => {
  const adminId = new mongoose.Types.ObjectId();
  const sellerAId = new mongoose.Types.ObjectId();
  const sellerBId = new mongoose.Types.ObjectId();
  const customerId = new mongoose.Types.ObjectId();

  const mockAdminUser = {
    _id: adminId,
    role: "admin",
    name: "Platform SuperAdmin",
    email: "admin@lyzov.com",
    toSafeObject: () => ({ _id: adminId, role: "admin", email: "admin@lyzov.com" }),
  };

  const mockSellerA = {
    _id: sellerAId,
    role: "seller",
    name: "Seller Alpha",
    email: "alpha@merchant.com",
    sellerProfile: {
      businessName: "Alpha Royal Fabrics",
      storeSlug: "alpha-royal-fabrics",
      kycStatus: "verified",
      commissionRate: 10,
      bankDetails: {
        accountHolderName: "Alpha Fabrics Ltd",
        accountNumber: "1234567890",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
      },
    },
    toSafeObject: function (opts) {
      return User.prototype.toSafeObject.call(this, opts);
    },
  };

  const mockSellerB = {
    _id: sellerBId,
    role: "seller",
    name: "Seller Beta",
    email: "beta@merchant.com",
    sellerProfile: {
      businessName: "Beta Leather Crafts",
      storeSlug: "beta-leather-crafts",
      kycStatus: "verified",
      commissionRate: 12,
      bankDetails: {
        accountHolderName: "Beta Leather Co",
        accountNumber: "9876543210",
        ifscCode: "ICIC0005678",
        bankName: "ICICI Bank",
      },
    },
    toSafeObject: function (opts) {
      return User.prototype.toSafeObject.call(this, opts);
    },
  };

  const mockPendingSeller = {
    _id: new mongoose.Types.ObjectId(),
    role: "seller",
    name: "Unverified Seller",
    email: "pending@merchant.com",
    sellerProfile: {
      businessName: "Pending Store",
      kycStatus: "pending",
    },
  };

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-01: User KYC Masking & Auto Store Slug Generation
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-01: User Model - Auto Store Slug Generation & Safe Object KYC Masking", () => {
    // 1. Slug Generation
    const rawUser = new User({
      name: "Vikram Singhania",
      email: "vikram@singhania.com",
      role: "seller",
      sellerProfile: {
        businessName: "Singhania Heritage Silks & Cashmere",
        panNumber: "ABCDE1234F",
        aadhaarNumber: "123456789012",
        panDocument: {
          url: "https://res.cloudinary.com/demo/image/upload/s--secret--/pan.jpg",
          publicId: "pan_123",
        },
      },
    });

    // Invoke pre-save hook logic
    if (!rawUser.sellerProfile.storeSlug && rawUser.sellerProfile.businessName) {
      const slugify = require("slugify");
      rawUser.sellerProfile.storeSlug = slugify(rawUser.sellerProfile.businessName, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    assert.strictEqual(
      rawUser.sellerProfile.storeSlug,
      "singhania-heritage-silks-and-cashmere",
      "Store slug must be correctly normalized and slugified"
    );

    // 2. Default Safe Object (Masked for privacy)
    const safeDefault = rawUser.toSafeObject();
    assert.strictEqual(
      safeDefault.sellerProfile.panNumber,
      "ABCDE****F",
      "PAN number must be masked in public safe object"
    );
    assert.strictEqual(
      safeDefault.sellerProfile.aadhaarNumber,
      "•••• •••• 9012",
      "Aadhaar number must be masked in public safe object"
    );
    assert.strictEqual(
      safeDefault.sellerProfile.panDocument.url,
      null,
      "Cloudinary private document URL must be nullified by default"
    );

    // 3. Admin Reveal Safe Object
    const safeRevealed = rawUser.toSafeObject({ revealKyc: true });
    assert.strictEqual(
      safeRevealed.sellerProfile.panNumber,
      "ABCDE1234F",
      "Admin reveal must expose full PAN number"
    );
    assert.strictEqual(
      safeRevealed.sellerProfile.aadhaarNumber,
      "123456789012",
      "Admin reveal must expose full Aadhaar number"
    );
    assert.strictEqual(
      safeRevealed.sellerProfile.panDocument.url,
      "https://res.cloudinary.com/demo/image/upload/s--secret--/pan.jpg",
      "Admin reveal must expose document URL"
    );
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-02: KYC Gating Middleware (requireVerifiedSeller)
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-02: RBAC & KYC Gating Middleware (requireVerifiedSeller)", () => {
    let nextCalled = false;
    const mockNext = (err) => {
      if (err) throw err;
      nextCalled = true;
    };

    // 1. Unverified seller is rejected with 403 Forbidden
    assert.throws(
      () => {
        requireVerifiedSeller({ user: mockPendingSeller }, {}, mockNext);
      },
      (err) => {
        return err.statusCode === 403 && err.message.includes("KYC status is currently 'pending'");
      },
      "Pending seller must be blocked with 403 Forbidden"
    );

    // 2. Verified seller passes through
    nextCalled = false;
    requireVerifiedSeller({ user: mockSellerA }, {}, mockNext);
    assert.strictEqual(nextCalled, true, "Verified seller must pass through middleware");

    // 3. SuperAdmin passes through automatically
    nextCalled = false;
    requireVerifiedSeller({ user: mockAdminUser }, {}, mockNext);
    assert.strictEqual(nextCalled, true, "Admin must bypass seller KYC verification");
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-03: Multi-Seller Product Isolation & IDOR Protection
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-03: Multi-Seller Product Isolation & IDOR Protection", async () => {
    const productAId = new mongoose.Types.ObjectId();
    const productA = {
      _id: productAId,
      title: "Handmade Pashmina Shawl",
      seller: sellerAId,
      price: 4999,
      save: async function () { return this; },
    };

    const originalProductFindById = Product.findById;
    Product.findById = (id) => ({
      populate: () => Promise.resolve(id.toString() === productAId.toString() ? productA : null),
      then: (fn) => fn(id.toString() === productAId.toString() ? productA : null),
    });

    try {
      // 1. Seller B attempts to update Seller A's product (IDOR Attack)
      const { req: reqB, res: resB, next: nextB } = createMockReqRes({
        user: mockSellerB,
        params: { id: productAId.toString() },
        body: { title: "Hacked by Seller B", price: 100 },
      });

      await assert.rejects(
        async () => {
          await productController.updateProduct(reqB, resB, nextB);
        },
        (err) => {
          return err.statusCode === 403 && err.message.includes("modify another seller's product");
        },
        "Seller B must be blocked with 403 when modifying Seller A's product"
      );

      // 2. Seller B attempts to delete Seller A's product
      const { req: reqDelB, res: resDelB, next: nextDelB } = createMockReqRes({
        user: mockSellerB,
        params: { id: productAId.toString() },
      });

      await assert.rejects(
        async () => {
          await productController.deleteProduct(reqDelB, resDelB, nextDelB);
        },
        (err) => {
          return err.statusCode === 403 && err.message.includes("delete another seller's product");
        },
        "Seller B must be blocked with 403 when deleting Seller A's product"
      );

      // 3. Seller A updates their own product -> Allowed
      const { req: reqA, res: resA, next: nextA } = createMockReqRes({
        user: mockSellerA,
        params: { id: productAId.toString() },
        body: { title: "Handmade Pashmina Shawl - Pure Cashmere" },
      });

      await productController.updateProduct(reqA, resA, nextA);
      assert.strictEqual(resA.getStatusCode(), 200, "Seller A must successfully update their own product");
      assert.strictEqual(productA.title, "Handmade Pashmina Shawl - Pure Cashmere");

      // 4. Admin updates Seller A's product -> Allowed
      const { req: reqAdmin, res: resAdmin, next: nextAdmin } = createMockReqRes({
        user: mockAdminUser,
        params: { id: productAId.toString() },
        body: { price: 5499 },
      });

      await productController.updateProduct(reqAdmin, resAdmin, nextAdmin);
      assert.strictEqual(resAdmin.getStatusCode(), 200, "Admin must be permitted to edit any product");
      assert.strictEqual(productA.price, 5499);
    } finally {
      Product.findById = originalProductFindById;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-04: Multi-Seller Checkout & SubOrder Splitting
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-04: Multi-Seller Checkout & SubOrder Splitting", async () => {
    const parentOrderId = new mongoose.Types.ObjectId();
    const createdSubOrders = [];
    const createdPayouts = [];

    // Mock Models
    const originalSubOrderCreate = SubOrder.create;
    const originalPayoutCreate = Payout.create;
    const originalOrderCreate = Order.create;
    const originalUserFindById = User.findById;
    const originalProductFindOneAndUpdate = Product.findOneAndUpdate;

    Product.findOneAndUpdate = async () => ({ _id: new mongoose.Types.ObjectId(), stock: 10 });

    Order.create = async (orderData) => ({
      _id: parentOrderId,
      orderNumber: "NC-TEST-MULTI-001",
      user: customerId,
      ...orderData,
      save: async function () { return this; },
    });

    SubOrder.create = async (subOrderData) => {
      const rec = {
        _id: new mongoose.Types.ObjectId(),
        ...subOrderData,
        save: async function () { return this; },
      };
      createdSubOrders.push(rec);
      return rec;
    };

    Payout.create = async (payoutData) => {
      const rec = {
        _id: new mongoose.Types.ObjectId(),
        ...payoutData,
        save: async function () { return this; },
      };
      createdPayouts.push(rec);
      return rec;
    };

    User.findById = (id) => ({
      select: () => {
        if (id.toString() === sellerAId.toString()) return Promise.resolve(mockSellerA);
        if (id.toString() === sellerBId.toString()) return Promise.resolve(mockSellerB);
        return Promise.resolve(null);
      },
    });

    try {
      const snapshot = {
        items: [
          {
            product: new mongoose.Types.ObjectId(),
            name: "Linen Shirt",
            seller: sellerAId,
            price: 1000,
            quantity: 2,
          },
          {
            product: new mongoose.Types.ObjectId(),
            name: "Leather Belt",
            seller: sellerBId,
            price: 500,
            quantity: 1,
          },
        ],
        itemsPrice: 2500,
        taxPrice: 0,
        shippingPrice: 100,
        discountAmount: 0,
        totalPrice: 2600,
      };

      const shippingAddress = {
        fullName: "Rahul Verma",
        phone: "9876543210",
        addressLine1: "123 MG Road",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India",
      };

      const order = await checkoutService.createOrderFromSnapshot({
        user: { _id: customerId },
        snapshot,
        shippingAddress,
        paymentMethod: "cod",
      });

      // Assertions on SubOrders
      assert.strictEqual(createdSubOrders.length, 2, "Must spawn exactly 2 sub-orders for 2 distinct sellers");

      const subOrderA = createdSubOrders.find((so) => so.seller.toString() === sellerAId.toString());
      assert.ok(subOrderA, "SubOrder for Seller A must exist");
      assert.strictEqual(subOrderA.subOrderNumber, "NC-TEST-MULTI-001-S01");
      assert.strictEqual(subOrderA.itemsPrice, 2000);
      assert.strictEqual(subOrderA.commissionRate, 10);
      assert.strictEqual(subOrderA.commissionAmount, 200, "10% commission on 2000 itemsPrice is 200");
      assert.strictEqual(subOrderA.sellerEarnings, 1880, "sellerTotal(2080) - commission(200) = 1880");

      const subOrderB = createdSubOrders.find((so) => so.seller.toString() === sellerBId.toString());
      assert.ok(subOrderB, "SubOrder for Seller B must exist");
      assert.strictEqual(subOrderB.subOrderNumber, "NC-TEST-MULTI-001-S02");
      assert.strictEqual(subOrderB.itemsPrice, 500);
      assert.strictEqual(subOrderB.commissionRate, 12);
      assert.strictEqual(subOrderB.commissionAmount, 60, "12% commission on 500 itemsPrice is 60");
      assert.strictEqual(subOrderB.sellerEarnings, 460, "sellerTotal(520) - commission(60) = 460");

      // Assertions on Payouts
      assert.strictEqual(createdPayouts.length, 2, "Must spawn exactly 2 payout ledger records");
      const payoutA = createdPayouts.find((p) => p.seller.toString() === sellerAId.toString());
      assert.strictEqual(payoutA.netAmount, 1880);
      assert.strictEqual(payoutA.status, "pending");
      assert.strictEqual(payoutA.bankDetailsSnapshot.bankName, "HDFC Bank");
    } finally {
      SubOrder.create = originalSubOrderCreate;
      Payout.create = originalPayoutCreate;
      Order.create = originalOrderCreate;
      User.findById = originalUserFindById;
      Product.findOneAndUpdate = originalProductFindOneAndUpdate;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-05: SubOrder Tenancy & Order List Isolation
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-05: SubOrder Tenancy & Order List Isolation", async () => {
    const mockSubOrdersSellerA = [
      {
        _id: new mongoose.Types.ObjectId(),
        subOrderNumber: "NC-100-S01",
        seller: sellerAId,
        parentOrder: new mongoose.Types.ObjectId(),
        orderStatus: "processing",
        totalPrice: 2200,
        createdAt: new Date(),
        customer: { name: "Arjun Verma", email: "arjun@example.com" },
        items: [],
        toObject: function () { return { ...this }; },
      },
    ];

    const originalSubOrderFind = SubOrder.find;
    const originalSubOrderCount = SubOrder.countDocuments;

    SubOrder.find = (query) => {
      assert.strictEqual(
        query.seller.toString(),
        sellerAId.toString(),
        "SubOrder query MUST be scoped to the authenticated seller"
      );
      return {
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => Promise.resolve(mockSubOrdersSellerA),
              }),
            }),
          }),
        }),
      };
    };

    SubOrder.countDocuments = (query) => {
      assert.strictEqual(query.seller.toString(), sellerAId.toString());
      return Promise.resolve(1);
    };

    try {
      const { req, res, next } = createMockReqRes({
        user: mockSellerA,
        query: { page: "1", limit: "10" },
      });

      await orderController.getAllOrders(req, res, next);
      const data = res.getResponseData();

      assert.strictEqual(res.getStatusCode(), 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(Array.isArray(data.data), true);
      assert.strictEqual(data.data.length, 1);
      // Aliased orderNumber for UI compatibility
      assert.strictEqual(data.data[0].orderNumber, "NC-100-S01");
      assert.strictEqual(data.data[0].user.name, "Arjun Verma");
    } finally {
      SubOrder.find = originalSubOrderFind;
      SubOrder.countDocuments = originalSubOrderCount;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-06: SubOrder Fulfillment & Parent Status Rollup
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-06: SubOrder Fulfillment & Parent Status Rollup", async () => {
    const parentOrderId = new mongoose.Types.ObjectId();
    const subOrderAId = new mongoose.Types.ObjectId();
    const subOrderBId = new mongoose.Types.ObjectId();

    let parentOrderStatus = "processing";
    const subOrderA = {
      _id: subOrderAId,
      subOrderNumber: "NC-ROLL-S01",
      seller: sellerAId,
      parentOrder: parentOrderId,
      orderStatus: "processing",
      statusHistory: [],
      save: async function () { return this; },
      toObject: function () { return { ...this }; },
    };

    const subOrderB = {
      _id: subOrderBId,
      subOrderNumber: "NC-ROLL-S02",
      seller: sellerBId,
      parentOrder: parentOrderId,
      orderStatus: "processing",
      statusHistory: [],
      save: async function () { return this; },
      toObject: function () { return { ...this }; },
    };

    const originalSubOrderFindOne = SubOrder.findOne;
    const originalSubOrderFind = SubOrder.find;
    const originalOrderFindById = Order.findById;

    SubOrder.findOne = (query) => {
      const qId = query.$or ? query.$or[0]._id : query._id;
      if (qId && qId.toString() === subOrderAId.toString()) return Promise.resolve(subOrderA);
      if (qId && qId.toString() === subOrderBId.toString()) return Promise.resolve(subOrderB);
      return Promise.resolve(null);
    };

    SubOrder.find = (query) => {
      return Promise.resolve([subOrderA, subOrderB]);
    };

    Order.findById = (id) => {
      const mockParent = {
        _id: parentOrderId,
        orderStatus: parentOrderStatus,
        statusHistory: [],
        save: async function () {
          parentOrderStatus = this.orderStatus;
          return this;
        },
      };
      return {
        populate: () => Promise.resolve(mockParent),
        then: (fn) => fn(mockParent),
      };
    };

    try {
      // 1. Seller A marks SubOrder A as "shipped"
      const { req: reqA, res: resA, next: nextA } = createMockReqRes({
        user: mockSellerA,
        params: { id: subOrderAId.toString() },
        body: { status: "shipped", trackingNumber: "AWB-ALPHA-123" },
      });

      await orderController.updateOrderStatus(reqA, resA, nextA);
      assert.strictEqual(resA.getStatusCode(), 200);
      assert.strictEqual(subOrderA.orderStatus, "shipped");
      // Sibling B is still processing, so parent order stays processing
      assert.strictEqual(
        parentOrderStatus,
        "processing",
        "Parent order status must remain 'processing' while sibling sub-order is unfulfilled"
      );

      // 2. Seller B marks SubOrder B as "shipped"
      const { req: reqB, res: resB, next: nextB } = createMockReqRes({
        user: mockSellerB,
        params: { id: subOrderBId.toString() },
        body: { status: "shipped", trackingNumber: "AWB-BETA-456" },
      });

      await orderController.updateOrderStatus(reqB, resB, nextB);
      assert.strictEqual(resB.getStatusCode(), 200);
      assert.strictEqual(subOrderB.orderStatus, "shipped");
      // Both sub-orders are now shipped -> parent rolls up to "shipped"!
      assert.strictEqual(
        parentOrderStatus,
        "shipped",
        "Parent order status must roll up to 'shipped' when all sub-orders are shipped"
      );
    } finally {
      SubOrder.findOne = originalSubOrderFindOne;
      SubOrder.find = originalSubOrderFind;
      Order.findById = originalOrderFindById;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-07: Marketplace Payout Release Lifecycle
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-07: Marketplace Payout Release Lifecycle", async () => {
    const payoutId = new mongoose.Types.ObjectId();
    const subOrderId = new mongoose.Types.ObjectId();

    const mockPayout = {
      _id: payoutId,
      subOrder: subOrderId,
      seller: sellerAId,
      netAmount: 1800,
      status: "pending",
      save: async function () { return this; },
    };

    let subOrderPayoutStatus = "pending";
    const originalPayoutFindById = Payout.findById;
    const originalSubOrderFindByIdAndUpdate = SubOrder.findByIdAndUpdate;

    Payout.findById = (id) => Promise.resolve(mockPayout);

    SubOrder.findByIdAndUpdate = (id, update) => {
      subOrderPayoutStatus = update.$set ? update.$set.payoutStatus : update.payoutStatus;
      return Promise.resolve({ _id: id, payoutStatus: subOrderPayoutStatus });
    };

    try {
      const { req, res, next } = createMockReqRes({
        user: mockAdminUser,
        params: { id: payoutId.toString() },
        body: { transactionReference: "UTR-HDFC-9988776655" },
      });

      await adminController.releaseSellerPayout(req, res, next);
      assert.strictEqual(res.getStatusCode(), 200);

      const data = res.getResponseData();
      assert.strictEqual(data.success, true);
      assert.strictEqual(mockPayout.status, "completed");
      assert.strictEqual(mockPayout.transactionReference, "UTR-HDFC-9988776655");
      assert.ok(mockPayout.paidAt instanceof Date);
      assert.strictEqual(subOrderPayoutStatus, "paid");
    } finally {
      Payout.findById = originalPayoutFindById;
      SubOrder.findByIdAndUpdate = originalSubOrderFindByIdAndUpdate;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-08: Privilege Escalation Protection (Settings Route)
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-08: Privilege Escalation Protection (Settings Route)", () => {
    let nextCalled = false;
    const mockNext = (err) => {
      if (err) throw err;
      nextCalled = true;
    };

    // Authorize middleware requires "admin"
    const adminOnlyMiddleware = authorize("admin");

    // 1. Seller attempts to access admin-only settings route -> Blocked with 403 Forbidden
    assert.throws(
      () => {
        adminOnlyMiddleware({ user: mockSellerA }, {}, mockNext);
      },
      (err) => {
        return err.statusCode === 403 && err.message.includes("You do not have permission");
      },
      "Seller role must be blocked with 403 from settings modification"
    );

    // 2. Admin access passes through
    nextCalled = false;
    adminOnlyMiddleware({ user: mockAdminUser }, {}, mockNext);
    assert.strictEqual(nextCalled, true, "SuperAdmin must be authorized for settings");
  });
});
