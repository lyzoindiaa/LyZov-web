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
const Review = require("../models/Review");
const { requireVerifiedSeller, authorize } = require("../middleware/authMiddleware");
const productController = require("../controllers/productController");
const orderController = require("../controllers/orderController");
const adminController = require("../controllers/adminController");
const reviewController = require("../controllers/reviewController");
const userController = require("../controllers/userController");
const checkoutService = require("../services/checkoutService");
const stockService = require("../services/stockService");
const { calculateSubOrderFinancials, getSettlementPeriod } = require("../services/commissionService");
const {
  handleSubOrderDelivery,
  promoteMaturedCoolingOffPayouts,
  generateBankNeftCsv,
} = require("../services/settlementService");

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

      // 5. Seller attempts to update a product with NO seller (null/undefined) -> Blocked with 403
      const productNoSeller = {
        _id: new mongoose.Types.ObjectId(),
        title: "Platform Unassigned Product",
        seller: null,
      };
      Product.findById = (id) => ({
        populate: () => Promise.resolve(productNoSeller),
        then: (fn) => fn(productNoSeller),
      });

      const { req: reqUnassigned, res: resUnassigned, next: nextUnassigned } = createMockReqRes({
        user: mockSellerA,
        params: { id: productNoSeller._id.toString() },
        body: { price: 999 },
      });

      await assert.rejects(
        async () => {
          await productController.updateProduct(reqUnassigned, resUnassigned, nextUnassigned);
        },
        (err) => {
          return err.statusCode === 403 && err.message.includes("modify another seller's product");
        },
        "Seller must be blocked when modifying an unassigned / platform product"
      );

      // 6. getMyProducts strictly filters by req.user._id for sellers
      let capturedFilter = null;
      const originalFind = Product.find;
      const originalCount = Product.countDocuments;

      Product.find = (filter) => {
        capturedFilter = filter;
        return {
          populate: () => ({
            populate: () => ({
              sort: () => ({
                skip: () => ({
                  limit: () => Promise.resolve([productA]),
                }),
              }),
            }),
          }),
        };
      };
      Product.countDocuments = (filter) => Promise.resolve(1);

      const { req: reqMine, res: resMine, next: nextMine } = createMockReqRes({
        user: mockSellerA,
        query: { limit: 10 },
      });

      await productController.getMyProducts(reqMine, resMine, nextMine);
      assert.strictEqual(resMine.getStatusCode(), 200);
      assert.strictEqual(capturedFilter.seller.toString(), sellerAId.toString(), "getMyProducts must strictly scope to sellerAId");

      Product.find = originalFind;
      Product.countDocuments = originalCount;
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

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-09: Seller-Scoped Marketplace Payouts & Aggregate Financial Metrics
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-09: Seller-Scoped Marketplace Payouts & Aggregate Financial Metrics", async () => {
    let capturedFilter = null;
    const originalCountDocuments = Payout.countDocuments;
    const originalFind = Payout.find;
    const originalAggregate = Payout.aggregate;

    Payout.countDocuments = (filter) => {
      capturedFilter = filter;
      return Promise.resolve(1);
    };

    Payout.find = (filter) => ({
      populate: () => ({
        populate: () => ({
          populate: () => ({
            sort: () => ({
              skip: () => ({
                limit: () =>
                  Promise.resolve([
                    {
                      _id: new mongoose.Types.ObjectId(),
                      seller: mockSellerA._id,
                      grossAmount: 2000,
                      commissionAmount: 120,
                      netAmount: 1880,
                      status: "pending",
                    },
                  ]),
              }),
            }),
          }),
        }),
      }),
    });

    Payout.aggregate = () =>
      Promise.resolve([
        { _id: "pending", totalNet: 1880, totalGross: 2000, totalCommission: 120, count: 1 },
      ]);

    try {
      const { req, res, next } = createMockReqRes({
        user: mockSellerA,
      });

      await adminController.getMarketplacePayouts(req, res, next);
      assert.strictEqual(res.getStatusCode(), 200);

      const resp = res.getResponseData();
      assert.strictEqual(resp.success, true);
      assert.strictEqual(
        capturedFilter.seller.toString(),
        mockSellerA._id.toString(),
        "Payout query must be strictly scoped to seller's own ID"
      );
      assert.strictEqual(resp.meta.financials.escrowBalance, 1880);
      assert.strictEqual(resp.meta.financials.totalGross, 2000);
      assert.strictEqual(resp.meta.financials.totalCommission, 120);
    } finally {
      Payout.countDocuments = originalCountDocuments;
      Payout.find = originalFind;
      Payout.aggregate = originalAggregate;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-10: SuperAdmin Product Moderation Lifecycle
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-10: SuperAdmin Product Moderation Lifecycle", async () => {
    const prodId = new mongoose.Types.ObjectId();
    const mockProductDoc = {
      _id: prodId,
      moderationStatus: "pending_approval",
      isActive: true,
      moderationFeedback: "",
      save: function () {
        return Promise.resolve(this);
      },
    };

    const originalFindById = Product.findById;
    Product.findById = (id) => Promise.resolve(mockProductDoc);

    try {
      // 1. SuperAdmin approves product
      const { req: reqApprove, res: resApprove, next: nextApprove } = createMockReqRes({
        user: mockAdminUser,
        params: { id: prodId.toString() },
        body: { status: "approved" },
      });

      await adminController.moderateProduct(reqApprove, resApprove, nextApprove);
      assert.strictEqual(resApprove.getStatusCode(), 200);
      assert.strictEqual(mockProductDoc.moderationStatus, "approved");

      // 2. SuperAdmin rejects product with feedback
      const { req: reqReject, res: resReject, next: nextReject } = createMockReqRes({
        user: mockAdminUser,
        params: { id: prodId.toString() },
        body: {
          status: "rejected",
          feedback: "Images must have clean white background.",
        },
      });

      await adminController.moderateProduct(reqReject, resReject, nextReject);
      assert.strictEqual(resReject.getStatusCode(), 200);
      assert.strictEqual(mockProductDoc.moderationStatus, "rejected");
      assert.strictEqual(mockProductDoc.isActive, false);
      assert.strictEqual(mockProductDoc.moderationFeedback, "Images must have clean white background.");
    } finally {
      Product.findById = originalFindById;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-11: Verified Customer Reviews & Rating Distribution Breakdown
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-11: Verified Customer Reviews & Rating Distribution Breakdown", async () => {
    const testProductId = new mongoose.Types.ObjectId();
    const originalFind = Review.find;
    const originalFindById = Review.findById;
    const originalCountDocuments = Review.countDocuments;
    const originalAggregate = Review.aggregate;
    const originalProductFindById = Product.findById;
    const originalReviewFindOne = Review.findOne;
    const originalOrderFindOne = Order.findOne;
    const originalReviewCreate = Review.create;

    Review.find = () => ({
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () =>
              Promise.resolve([
                {
                  _id: new mongoose.Types.ObjectId(),
                  rating: 5,
                  title: "Incredible craftsmanship",
                  comment: "Loved the quality!",
                  isVerifiedPurchase: true,
                },
              ]),
          }),
        }),
      }),
    });

    Review.countDocuments = () => Promise.resolve(2);

    Review.aggregate = () =>
      Promise.resolve([
        { _id: 5, count: 1 },
        { _id: 4, count: 1 },
      ]);

    try {
      // 1. Test getProductReviews with breakdown
      const { req: reqGet, res: resGet, next: nextGet } = createMockReqRes({
        params: { productId: testProductId.toString() },
      });

      await reviewController.getProductReviews(reqGet, resGet, nextGet);
      assert.strictEqual(resGet.getStatusCode(), 200);

      const data = resGet.getResponseData();
      assert.strictEqual(data.meta.distribution[5], 1);
      assert.strictEqual(data.meta.distribution[4], 1);
      assert.strictEqual(data.meta.averageRating, 4.5);

      // 2. Non-buyer attempts to review -> 403 Forbidden
      Product.findById = () => Promise.resolve({ _id: testProductId });
      Review.findOne = () => Promise.resolve(null); // No existing review
      Order.findOne = () => Promise.resolve(null); // User has NOT purchased

      const { req: reqNonBuyer, res: resNonBuyer, next: nextNonBuyer } = createMockReqRes({
        user: { _id: new mongoose.Types.ObjectId(), role: "customer" },
        body: {
          productId: testProductId.toString(),
          rating: 4,
          comment: "Looks nice but never bought.",
        },
      });

      await assert.rejects(
        async () => {
          await reviewController.createReview(reqNonBuyer, resNonBuyer, nextNonBuyer);
        },
        (err) => {
          return err.statusCode === 403 && err.message.includes("restricted to verified customers");
        },
        "Non-buyer must be rejected with 403 Forbidden"
      );

      // 3. Verified buyer submits review -> 201 Created & populated
      const verifiedBuyerId = new mongoose.Types.ObjectId();
      Order.findOne = () => Promise.resolve({ _id: new mongoose.Types.ObjectId(), isPaid: true }); // Paid order exists

      let createdReviewPayload = null;
      Review.create = (payload) => {
        createdReviewPayload = { ...payload, _id: new mongoose.Types.ObjectId() };
        return Promise.resolve(createdReviewPayload);
      };

      Review.findById = (id) => ({
        populate: () => Promise.resolve({ ...createdReviewPayload, user: { name: "Aditya", avatar: null } }),
      });

      const { req: reqCreate, res: resCreate, next: nextCreate } = createMockReqRes({
        user: { _id: verifiedBuyerId, role: "customer" },
        body: {
          productId: testProductId.toString(),
          rating: 5,
          title: "Top tier jacket",
          comment: "Best fit and stitching I have ever worn.",
        },
      });

      await reviewController.createReview(reqCreate, resCreate, nextCreate);
      assert.strictEqual(resCreate.getStatusCode(), 201);
      assert.strictEqual(createdReviewPayload.isVerifiedPurchase, true, "Must flag as verified purchase");
      assert.strictEqual(createdReviewPayload.rating, 5);
      assert.strictEqual(createdReviewPayload.title, "Top tier jacket");

      // 4. Test review eligibility endpoint
      const { req: reqElig, res: resElig, next: nextElig } = createMockReqRes({
        user: { _id: verifiedBuyerId, role: "customer" },
        params: { productId: testProductId.toString() },
      });

      // User has existing review now
      Review.findOne = () => Promise.resolve(createdReviewPayload);
      await reviewController.checkReviewEligibility(reqElig, resElig, nextElig);
      assert.strictEqual(resElig.getStatusCode(), 200);
      assert.strictEqual(resElig.getResponseData().data.alreadyReviewed, true);
      assert.strictEqual(resElig.getResponseData().data.canReview, false);
    } finally {
      Review.find = originalFind;
      Review.findById = originalFindById;
      Review.countDocuments = originalCountDocuments;
      Review.aggregate = originalAggregate;
      Product.findById = originalProductFindById;
      Review.findOne = originalReviewFindOne;
      Order.findOne = originalOrderFindOne;
      Review.create = originalReviewCreate;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-12: Vacation Mode & Tenant-Isolated getMyProducts
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-12: Vacation Mode & Tenant-Isolated getMyProducts", async () => {
    const originalProductFind = Product.find;
    const originalProductCountDocuments = Product.countDocuments;
    const originalUserFind = User.find;
    const originalUserFindOne = User.findOne;

    let capturedFilter = null;
    const createChainableFind = () => {
      const chainable = {
        populate: () => chainable,
        sort: () => chainable,
        select: () => chainable,
        skip: () => chainable,
        limit: () => chainable,
        find: () => chainable,
        clone: () => chainable,
        countDocuments: () => Promise.resolve(0),
        then: (resolve) => Promise.resolve([]).then(resolve),
      };
      return chainable;
    };

    Product.find = (filter) => {
      capturedFilter = filter;
      return createChainableFind();
    };

    Product.countDocuments = (filter) => {
      capturedFilter = filter;
      return Promise.resolve(0);
    };

    try {
      // 1. Seller Alpha requests getMyProducts -> strictly scoped to sellerAId
      const { req: reqAlpha, res: resAlpha, next: nextAlpha } = createMockReqRes({
        user: mockSellerA,
        query: { seller: sellerBId.toString() }, // Attempting IDOR spoof
      });

      await productController.getMyProducts(reqAlpha, resAlpha, nextAlpha);
      assert.strictEqual(resAlpha.getStatusCode(), 200);
      assert.strictEqual(
        capturedFilter.seller.toString(),
        sellerAId.toString(),
        "Seller must strictly only query their own products, spoofed query param ignored"
      );

      // 2. SuperAdmin requests getMyProducts with seller filter -> respects query
      const { req: reqAdm, res: resAdm, next: nextAdm } = createMockReqRes({
        user: mockAdminUser,
        query: { seller: sellerBId.toString() },
      });

      await productController.getMyProducts(reqAdm, resAdm, nextAdm);
      assert.strictEqual(resAdm.getStatusCode(), 200);
      assert.strictEqual(
        capturedFilter.seller.toString(),
        sellerBId.toString(),
        "SuperAdmin can inspect specific seller products"
      );

      // 3. Public getProducts excludes vacation sellers
      User.find = () => ({
        distinct: () => Promise.resolve([sellerAId]),
      });

      let publicCatalogFilter = null;
      Product.find = (filter) => {
        publicCatalogFilter = filter;
        return createChainableFind();
      };

      const { req: reqPublic, res: resPublic, next: nextPublic } = createMockReqRes({
        query: {},
      });

      await productController.getProducts(reqPublic, resPublic, nextPublic);
      assert.strictEqual(resPublic.getStatusCode(), 200);
      assert.ok(
        publicCatalogFilter.seller?.$nin?.some?.((id) => id.toString() === sellerAId.toString()),
        "Public product catalog must exclude products belonging to vacation sellers"
      );

      // 4. Public getSellerStorefront for vacationing seller returns isVacationMode: true and 0 products
      User.findOne = () => ({
        select: () =>
          Promise.resolve({
            _id: sellerAId,
            name: "Alpha Royal Fabrics",
            role: "seller",
            isActive: true,
            createdAt: new Date(),
            sellerProfile: {
              businessName: "Alpha Royal Fabrics",
              storeSlug: "alpha-royal-fabrics",
              isVacationMode: true,
              vacationMessage: "We are away until Diwali!",
              kycStatus: "verified",
            },
          }),
      });

      const { req: reqStore, res: resStore, next: nextStore } = createMockReqRes({
        params: { storeSlug: "alpha-royal-fabrics" },
      });

      await productController.getSellerStorefront(reqStore, resStore, nextStore);
      assert.strictEqual(resStore.getStatusCode(), 200);
      const storeData = resStore.getResponseData()?.data;
      assert.strictEqual(storeData?.seller?.isVacationMode, true);
      assert.strictEqual(storeData?.seller?.vacationMessage, "We are away until Diwali!");
      assert.strictEqual(storeData?.products?.length, 0, "No sale products returned during vacation");
    } finally {
      Product.find = originalProductFind;
      Product.countDocuments = originalProductCountDocuments;
      User.find = originalUserFind;
      User.findOne = originalUserFindOne;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-13: KYC Document Lock on Verified Sellers
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-13: KYC Document Lock on Verified Sellers", async () => {
    const originalUserFindById = User.findById;

    const mockVerifiedSellerDoc = {
      _id: sellerAId,
      name: "Alpha Royal Fabrics",
      role: "seller",
      phone: "9876543210",
      sellerProfile: {
        businessName: "Alpha Royal Fabrics",
        kycStatus: "verified",
        panNumber: "encrypted_pan_mock",
        aadhaarNumber: "encrypted_aadhaar_mock",
        panDocument: { url: "https://cloud.com/pan.jpg", publicId: "pan_123" },
        aadhaarDocument: { url: "https://cloud.com/aadhaar.jpg", publicId: "aadhaar_123" },
      },
      save: async function () { return this; },
      toSafeObject: function () { return this; },
    };

    User.findById = (id) => Promise.resolve(mockVerifiedSellerDoc);

    try {
      // 1. Seller attempts to alter verified PAN number -> 400 Bad Request
      const { req: reqPan, res: resPan, next: nextPan } = createMockReqRes({
        user: { _id: sellerAId, role: "seller" },
        body: { panNumber: "ABCDE9999Z" },
      });

      await assert.rejects(
        async () => {
          await userController.updateSellerProfile(reqPan, resPan, nextPan);
        },
        (err) => {
          return err.statusCode === 400 && err.message.includes("identity details are locked");
        },
        "Verified seller modifying PAN must throw 400 KYC Locked error"
      );

      // 2. Seller attempts to upload new PAN file -> 400 Bad Request
      const { req: reqFile, res: resFile, next: nextFile } = createMockReqRes({
        user: { _id: sellerAId, role: "seller" },
        body: {},
      });
      reqFile.files = { panDocument: [{ buffer: Buffer.from("dummy") }] };

      await assert.rejects(
        async () => {
          await userController.updateSellerProfile(reqFile, resFile, nextFile);
        },
        (err) => {
          return err.statusCode === 400 && err.message.includes("identity details are locked");
        },
        "Verified seller uploading new PAN file must throw 400 KYC Locked error"
      );

      // 3. Seller attempts to delete KYC document -> 400 Bad Request
      const { req: reqDel, res: resDel, next: nextDel } = createMockReqRes({
        user: { _id: sellerAId, role: "seller" },
        params: { docType: "pan" },
      });

      await assert.rejects(
        async () => {
          await userController.deleteSellerDocument(reqDel, resDel, nextDel);
        },
        (err) => {
          return err.statusCode === 400 && err.message.includes("Verified documents cannot be deleted or removed");
        },
        "Verified seller attempting to delete document must throw 400 error"
      );
    } finally {
      User.findById = originalUserFindById;
    }
  });

  test("TEST-MS-14: SuperAdmin Account Deletion & Permanent Email Blacklist", async () => {
    const Session = require("../models/Session");
    const originalRevoke = Session.revokeAllUserSessions;
    Session.revokeAllUserSessions = async () => {};

    const originalFindById = User.findById;
    const originalFindOne = User.findOne;
    const originalProductUpdateMany = Product.updateMany;

    try {
      const sellerId = new mongoose.Types.ObjectId();
      const customerId = new mongoose.Types.ObjectId();

      const sellerDoc = {
        _id: sellerId,
        email: "terminated_seller@example.com",
        role: "seller",
        isActive: true,
        sellerProfile: { businessName: "Old Shop", isVacationMode: false },
        save: async function () { return this; },
      };

      const customerDoc = {
        _id: customerId,
        email: "terminated_customer@example.com",
        role: "customer",
        isActive: true,
        save: async function () { return this; },
      };

      User.findOne = (query) => ({
        then: (resolve) => {
          if (query?.email) {
            resolve({ email: query.email, isDeleted: true });
          } else if (query?.role === "seller") {
            resolve(sellerDoc);
          } else if (query?.role === "customer") {
            resolve(customerDoc);
          } else {
            resolve(null);
          }
        },
      });

      let productsDeactivated = false;
      Product.updateMany = async () => {
        productsDeactivated = true;
        return { modifiedCount: 3 };
      };

      // 1. Delete seller
      const { req: reqS, res: resS, next: nextS } = createMockReqRes({
        user: { role: "admin" },
        params: { id: sellerId.toString() },
      });
      await adminController.deleteSellerAccount(reqS, resS, nextS);
      assert.strictEqual(sellerDoc.isDeleted, true);
      assert.strictEqual(sellerDoc.isActive, false);
      assert.strictEqual(sellerDoc.sellerProfile.isVacationMode, true);
      assert.strictEqual(productsDeactivated, true);

      // 2. Delete customer
      const { req: reqC, res: resC, next: nextC } = createMockReqRes({
        user: { role: "admin" },
        params: { id: customerId.toString() },
      });
      await adminController.deleteCustomerAccount(reqC, resC, nextC);
      assert.strictEqual(customerDoc.isDeleted, true);
      assert.strictEqual(customerDoc.isActive, false);

      // 3. Invite seller with blacklisted email throws 400
      const { req: reqInv, res: resInv, next: nextInv } = createMockReqRes({
        user: { role: "admin" },
        body: { email: "terminated_seller@example.com", name: "Terminated" },
      });
      await assert.rejects(
        async () => {
          await adminController.inviteSeller(reqInv, resInv, nextInv);
        },
        (err) => err.statusCode === 400 && err.message.includes("previously terminated")
      );
    } finally {
      Session.revokeAllUserSessions = originalRevoke;
      User.findById = originalFindById;
      User.findOne = originalFindOne;
      Product.updateMany = originalProductUpdateMany;
    }
  });

  test("TEST-MS-15: Brand Governance - Duplicate Check and Product Reference Integrity", async () => {
    const Brand = require("../models/Brand");
    const originalBrandFindOne = Brand.findOne;
    const originalBrandFindById = Brand.findById;
    const originalProductCountDocuments = Product.countDocuments;

    try {
      const brandId = new mongoose.Types.ObjectId();
      const existingBrand = { _id: brandId, name: "Puma", logo: { publicId: "" } };

      // 1. Duplicate check throws 400
      Brand.findOne = () => ({
        then: (resolve) => resolve(existingBrand),
      });
      const { req: reqCreate, res: resCreate, next: nextCreate } = createMockReqRes({
        user: { role: "seller" },
        body: { name: "puma" },
      });
      const brandController = require("../controllers/brandController");
      await assert.rejects(
        async () => {
          await brandController.createBrand(reqCreate, resCreate, nextCreate);
        },
        (err) => err.statusCode === 400 && err.message.includes("already exists")
      );

      // 2. Deleting brand with associated products throws 400
      Brand.findById = () => ({
        then: (resolve) => resolve(existingBrand),
      });
      Product.countDocuments = async () => 5;
      const { req: reqDel, res: resDel, next: nextDel } = createMockReqRes({
        user: { role: "admin" },
        params: { id: brandId.toString() },
      });
      await assert.rejects(
        async () => {
          await brandController.deleteBrand(reqDel, resDel, nextDel);
        },
        (err) => err.statusCode === 400 && err.message.includes("currently assigned to 5 product(s)")
      );
    } finally {
      Brand.findOne = originalBrandFindOne;
      Brand.findById = originalBrandFindById;
      Product.countDocuments = originalProductCountDocuments;
    }
  });

  test("TEST-MS-16: Checkout Service - Populated Seller Object Does Not Crash SubOrder Creation", async () => {
    const Cart = require("../models/Cart");
    const originalProductFindById = Product.findById;
    const originalCartFindOne = Cart.findOne;

    try {
      const sellerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();

      // Product has populated seller object
      const productMock = {
        _id: productId,
        title: "Classic Watch",
        price: 500,
        discountPrice: 450,
        stock: 10,
        isActive: true,
        seller: {
          _id: sellerId,
          sellerProfile: { businessName: "Watch Store", isVacationMode: false },
        },
      };

      Product.findById = (id) => ({
        populate: () => ({
          then: (resolve) => resolve(productMock),
        }),
      });

      Cart.findOne = () => ({
        then: (resolve) =>
          resolve({
            items: [{ product: productId, quantity: 1, name: "Classic Watch" }],
          }),
      });

      const snapshot = await checkoutService.buildCheckoutSnapshot({
        _id: new mongoose.Types.ObjectId(),
        role: "customer",
      });

      assert.strictEqual(snapshot.items[0].seller.toString(), sellerId.toString());
      assert.strictEqual(snapshot.items[0].seller.sellerProfile, undefined, "sellerProfile must not leak into item.seller");
    } finally {
      Product.findById = originalProductFindById;
      Cart.findOne = originalCartFindOne;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-17: Dynamic Tiered Commission with GST (18%) & TCS (1%)
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-17: Dynamic Tiered Commission with GST (18%) & TCS (1%)", () => {
    const rule = {
      name: "Standard Apparel Tier",
      scope: "category",
      percentage: 10,
      fixedFee: 0,
      gstOnCommissionRate: 18.0,
      tcsRate: 1.0,
    };

    const financials = calculateSubOrderFinancials({
      sellerItemsPrice: 10000,
      sellerTotal: 10000,
      rule,
    });

    assert.strictEqual(financials.commissionRate, 10);
    assert.strictEqual(financials.commissionAmount, 1000, "10% commission on 10,000 is 1,000");
    assert.strictEqual(financials.gstOnCommission, 180, "18% GST on 1,000 commission is 180");
    assert.strictEqual(financials.tcsAmount, 100, "1% TCS on 10,000 items is 100");
    assert.strictEqual(financials.totalDeductions, 1280, "Total deductions = 1000 + 180 + 100 = 1280");
    assert.strictEqual(financials.sellerEarnings, 8720, "Net payout = 10000 - 1280 = 8720");
    assert.ok(financials.settlementPeriod.match(/^\d{4}-\d{2}$/), "Settlement period must be YYYY-MM");
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-18: SubOrder Delivery Cooling-Off (T+7d) & Maturity
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-18: SubOrder Delivery Cooling-Off (T+7d) & Maturity", async () => {
    const originalPayoutFindByIdAndUpdate = Payout.findByIdAndUpdate;
    const originalPayoutFind = Payout.find;
    const originalSubOrderFindByIdAndUpdate = SubOrder.findByIdAndUpdate;

    try {
      const payoutId = new mongoose.Types.ObjectId();
      const subOrderId = new mongoose.Types.ObjectId();
      let payoutUpdatedStatus = null;
      let payoutUpdatedEligibleAt = null;

      Payout.findByIdAndUpdate = (id, update) => {
        payoutUpdatedStatus = update.$set.status;
        payoutUpdatedEligibleAt = update.$set.eligibleAt;
        return Promise.resolve({ _id: id });
      };

      const mockSubOrder = {
        _id: subOrderId,
        payoutId,
        isDelivered: false,
        payoutStatus: "pending",
      };

      const deliveredAt = new Date("2026-10-01T12:00:00Z");
      await handleSubOrderDelivery({ subOrder: mockSubOrder, deliveredAt });

      assert.strictEqual(mockSubOrder.isDelivered, true);
      assert.strictEqual(mockSubOrder.payoutStatus, "cooling_off");
      assert.strictEqual(payoutUpdatedStatus, "cooling_off");

      const expectedEligible = new Date(deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      assert.strictEqual(mockSubOrder.coolingOffUntil.getTime(), expectedEligible.getTime());
      assert.strictEqual(payoutUpdatedEligibleAt.getTime(), expectedEligible.getTime());

      // Test maturity promotion
      const mockMaturedPayout = {
        _id: payoutId,
        subOrder: subOrderId,
        status: "cooling_off",
        eligibleAt: new Date(Date.now() - 1000), // In the past
        save: async function () {
          this.status = "eligible";
          return this;
        },
      };

      Payout.find = () => Promise.resolve([mockMaturedPayout]);
      let subOrderMaturedPayoutStatus = null;
      SubOrder.findByIdAndUpdate = (id, update) => {
        subOrderMaturedPayoutStatus = update.$set.payoutStatus;
        return Promise.resolve({ _id: id });
      };

      const result = await promoteMaturedCoolingOffPayouts();
      assert.strictEqual(result.promotedCount, 1);
      assert.strictEqual(mockMaturedPayout.status, "eligible");
      assert.strictEqual(subOrderMaturedPayoutStatus, "eligible");
    } finally {
      Payout.findByIdAndUpdate = originalPayoutFindByIdAndUpdate;
      Payout.find = originalPayoutFind;
      SubOrder.findByIdAndUpdate = originalSubOrderFindByIdAndUpdate;
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TEST-MS-19: Monthly Settlement Batch Aggregation & RBI NEFT CSV
  ───────────────────────────────────────────────────────────── */
  test("TEST-MS-19: Monthly Settlement Batch Aggregation & RBI NEFT CSV", () => {
    const mockBatches = [
      {
        sellerId: new mongoose.Types.ObjectId(),
        businessName: "Artisan Silks",
        bankDetails: {
          accountHolderName: "Artisan Silks Pvt Ltd",
          accountNumber: "50200012345678",
          ifscCode: "HDFC0001234",
          bankName: "HDFC Bank",
        },
        orderCount: 15,
        totalNet: 45600.5,
      },
      {
        sellerId: new mongoose.Types.ObjectId(),
        businessName: "Heritage Cotton",
        bankDetails: {
          accountHolderName: "Heritage Cotton LLP",
          accountNumber: "91900087654321",
          ifscCode: "ICIC0000999",
          bankName: "ICICI Bank",
        },
        orderCount: 8,
        totalNet: 18250.0,
      },
    ];

    const csv = generateBankNeftCsv(mockBatches, "2026-10");
    assert.ok(csv.includes("Beneficiary Name"), "CSV must include headers");
    assert.ok(csv.includes("50200012345678"), "CSV must contain merchant account number");
    assert.ok(csv.includes("HDFC0001234"), "CSV must contain IFSC code");
    assert.ok(csv.includes("45600.50"), "CSV must contain formatted net amount");
    assert.ok(csv.includes("2026-10"), "CSV must contain settlement period");
  });
});

