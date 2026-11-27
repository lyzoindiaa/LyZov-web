require("dotenv").config();
const assert = require("node:assert");
const { test, describe, beforeEach, afterEach } = require("node:test");
const mongoose = require("mongoose");

// Disable mongoose buffering so unmocked DB calls fail fast instead of hanging
mongoose.set("bufferCommands", false);

// Import controllers and models
const orderController = require("../controllers/orderController");
const shippingController = require("../controllers/shippingController");
const Order = require("../models/Order");
const Shipment = require("../models/Shipment");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const User = require("../models/User");
const SubOrder = require("../models/SubOrder");
const delhiveryService = require("../services/delhiveryService");

// Helper to mock express req, res & next
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

describe("Cancel & Exchange Flow Comprehensive Test Suite", () => {
  const userId = new mongoose.Types.ObjectId();
  const customerUser = { _id: userId, role: "customer" };
  const adminUser = { _id: new mongoose.Types.ObjectId(), role: "admin" };
  const productId = new mongoose.Types.ObjectId();

  let originalOrderFindById;
  let originalOrderFindOne;
  let originalOrderSave;
  let originalShipmentFindOne;
  let originalShipmentSave;
  let originalUserFindById;
  let originalProductFindByIdAndUpdate;
  let originalProductFindOneAndUpdate;
  let originalNotificationCreate;
  let originalDelhiveryCancel;
  let originalDelhiveryReversePickup;
  let originalStripeRefund;
  let originalSubOrderFind;

  beforeEach(() => {
    // Save original methods
    originalOrderFindById = Order.findById;
    originalOrderFindOne = Order.findOne;
    originalOrderFindOneAndUpdate = Order.findOneAndUpdate;
    originalOrderSave = Order.prototype.save;
    originalShipmentFindOne = Shipment.findOne;
    originalShipmentSave = Shipment.prototype.save;
    originalUserFindById = User.findById;
    originalProductFindByIdAndUpdate = Product.findByIdAndUpdate;
    originalProductFindOneAndUpdate = Product.findOneAndUpdate;
    originalNotificationCreate = Notification.create;
    originalDelhiveryCancel = delhiveryService.cancelOrder;
    originalDelhiveryReversePickup = delhiveryService.createReversePickup;
    originalSubOrderFind = SubOrder.find;

    // Default mocks
    Notification.create = async () => ({ _id: new mongoose.Types.ObjectId() });
    User.findById = async () => null;
    Product.findByIdAndUpdate = async () => ({ _id: productId, stock: 10 });
    Product.findOneAndUpdate = async () => ({ _id: productId, stock: 10 });
    Order.prototype.save = async function () { return this; };
    Shipment.prototype.save = async function () { return this; };
    SubOrder.find = async () => [];

    Order.findOneAndUpdate = async (query, update) => {
      const order = await Order.findById(query._id);
      if (!order) return null;
      if (query.cancellationClaimedAt === null) {
        if (order.cancellationClaimedAt) return null;
        if (query.orderStatus?.$in && !query.orderStatus.$in.includes(order.orderStatus)) return null;
        order.cancellationClaimedAt = new Date();
        return order;
      }
      return order;
    };
  });

  afterEach(() => {
    // Restore original methods
    Order.findById = originalOrderFindById;
    Order.findOne = originalOrderFindOne;
    Order.findOneAndUpdate = originalOrderFindOneAndUpdate;
    Order.prototype.save = originalOrderSave;
    Shipment.findOne = originalShipmentFindOne;
    Shipment.prototype.save = originalShipmentSave;
    User.findById = originalUserFindById;
    Product.findByIdAndUpdate = originalProductFindByIdAndUpdate;
    Product.findOneAndUpdate = originalProductFindOneAndUpdate;
    Notification.create = originalNotificationCreate;
    delhiveryService.cancelOrder = originalDelhiveryCancel;
    delhiveryService.createReversePickup = originalDelhiveryReversePickup;
    SubOrder.find = originalSubOrderFind;
  });

  // -------------------------------------------------------------
  // CAN-01: Customer cancels 'pending' order (No AWB yet)
  // -------------------------------------------------------------
  test("CAN-01: Customer cancels pending order (no AWB) -> order status is cancelled, no Delhivery API call", async () => {
    let delhiveryCalled = false;
    delhiveryService.cancelOrder = async () => {
      delhiveryCalled = true;
    };

    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-001",
      user: userId,
      orderStatus: "pending",
      paymentMethod: "cod",
      isPaid: false,
      items: [{ product: productId, quantity: 1, price: 999, name: "Classic Blazer" }],
      statusHistory: [],
      cancelReason: "",
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;
    Shipment.findOne = async () => null; // No shipment manifested

    const { req, res, next } = createMockReqRes({
      user: customerUser,
      params: { id: mockOrder._id.toString() },
      body: { reason: "Changed mind before shipment" },
    });

    await orderController.cancelOrder(req, res, next);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockOrder.orderStatus, "cancelled");
    assert.strictEqual(mockOrder.cancelReason, "Changed mind before shipment");
    assert.strictEqual(delhiveryCalled, false, "Delhivery cancel API should NOT be called when no shipment exists");
  });

  // -------------------------------------------------------------
  // CAN-02: Customer cancels 'processing' order (AWB generated)
  // -------------------------------------------------------------
  test("CAN-02: Customer cancels processing order with AWB -> Delhivery Cancel API is called, Shipment is Cancelled", async () => {
    let waybillCancelled = null;
    delhiveryService.cancelOrder = async (waybill) => {
      waybillCancelled = waybill;
      return { status: "success" };
    };

    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-002",
      user: userId,
      orderStatus: "processing",
      paymentMethod: "cod",
      isPaid: false,
      items: [{ product: productId, quantity: 2, price: 1500, name: "Oxford Shirt" }],
      statusHistory: [],
      cancelReason: "",
      save: async function () { return this; },
    };

    const mockShipment = {
      _id: new mongoose.Types.ObjectId(),
      order: mockOrder._id,
      waybillNumber: "DLV1234567890",
      status: "Manifested",
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;
    Shipment.findOne = async () => mockShipment;

    const { req, res, next } = createMockReqRes({
      user: customerUser,
      params: { id: mockOrder._id.toString() },
      body: { reason: "Order placed by mistake" },
    });

    await orderController.cancelOrder(req, res, next);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockOrder.orderStatus, "cancelled");
    assert.strictEqual(mockShipment.status, "Cancelled");
    assert.strictEqual(waybillCancelled, "DLV1234567890", "Delhivery cancel API must be called with waybill");
  });

  // -------------------------------------------------------------
  // CAN-03: Customer attempts to cancel 'shipped' or 'delivered' order
  // -------------------------------------------------------------
  test("CAN-03: Customer attempts to cancel shipped order -> 400 Bad Request error returned", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-003",
      user: userId,
      orderStatus: "shipped",
      paymentMethod: "cod",
      items: [],
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;

    const { req, res, next } = createMockReqRes({
      user: customerUser,
      params: { id: mockOrder._id.toString() },
      body: { reason: "Need to cancel" },
    });

    try {
      await orderController.cancelOrder(req, res, next);
      assert.fail("Should have thrown 400 Bad Request");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /Cannot cancel an order that has already shipped or delivered/i);
    }
  });

  // -------------------------------------------------------------
  // RET-01: Customer requests return past 7 days of delivery
  // -------------------------------------------------------------
  test("RET-01: Customer requests return past 7 days -> 400 Bad Request (return window expired)", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-004",
      user: userId,
      orderStatus: "delivered",
      deliveredAt: eightDaysAgo,
      returnStatus: "Not Requested",
      items: [],
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;

    const { req, res, next } = createMockReqRes({
      user: customerUser,
      params: { id: mockOrder._id.toString() },
      body: { reason: "Size doesn't fit" },
    });

    try {
      await orderController.returnRequest(req, res, next);
      assert.fail("Should have thrown 400 Return window expired");
    } catch (err) {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /Return window expired/i);
    }
  });

  // -------------------------------------------------------------
  // RET-02: Customer requests return for valid order within 7 days
  // -------------------------------------------------------------
  test("RET-02: Customer requests return within 7 days -> returnStatus becomes Requested", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-005",
      user: userId,
      orderStatus: "delivered",
      deliveredAt: twoDaysAgo,
      returnStatus: "Not Requested",
      returnReason: "",
      isExchange: false,
      statusHistory: [],
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;

    const { req, res, next } = createMockReqRes({
      user: customerUser,
      params: { id: mockOrder._id.toString() },
      body: { reason: "Fabric color is different from photo", isExchange: false },
    });

    await orderController.returnRequest(req, res, next);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockOrder.returnStatus, "Requested");
    assert.strictEqual(mockOrder.returnReason, "Fabric color is different from photo");
    assert.strictEqual(mockOrder.isExchange, false);
  });

  // -------------------------------------------------------------
  // RET-03: Admin approves return -> Delhivery reverse pickup triggered & Shipment created
  // -------------------------------------------------------------
  test("RET-03: Admin approves return -> Delhivery reverse pickup triggered, return Shipment created, returnStatus Approved", async () => {
    let reversePickupCalledWith = null;
    delhiveryService.createReversePickup = async (payload) => {
      reversePickupCalledWith = payload;
      return {
        packages: [{ waybill: "REV-DELHIVERY-9988" }],
      };
    };

    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-006",
      user: userId,
      orderStatus: "delivered",
      returnStatus: "Requested",
      returnReason: "Defective button",
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 High Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        phone: "9876543210",
      },
      items: [{ name: "Tuxedo Suit", quantity: 1, price: 5000 }],
      totalPrice: 5000,
      statusHistory: [],
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;

    let createdShipment = null;
    Shipment.prototype.save = async function () {
      createdShipment = this;
      return this;
    };

    const { req, res, next } = createMockReqRes({
      user: adminUser,
      params: { id: mockOrder._id.toString() },
      body: { pickupWarehouseName: "Central Warehouse" },
    });

    await orderController.approveReturn(req, res, next);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockOrder.returnStatus, "Approved");
    assert.ok(createdShipment, "A return shipment document must be created");
    assert.match(createdShipment.waybillNumber, /^REV-/);
    assert.strictEqual(createdShipment.paymentMode, "Pickup");
  });

  // -------------------------------------------------------------
  // RET-04: Delhivery Webhook receives 'Picked Up' event
  // -------------------------------------------------------------
  test("RET-04: Delhivery Webhook receives Picked Up event -> Shipment status and Order returnStatus update to Picked Up", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-007",
      user: userId,
      orderStatus: "delivered",
      returnStatus: "Approved",
      statusHistory: [],
      save: async function () { return this; },
    };

    const mockShipment = {
      _id: new mongoose.Types.ObjectId(),
      order: mockOrder._id,
      waybillNumber: "REV-DELHIVERY-9988",
      paymentMode: "Pickup",
      status: "Manifested",
      save: async function () { return this; },
    };

    Shipment.findOne = async () => mockShipment;
    Order.findById = async () => mockOrder;

    const { req, res } = createMockReqRes({
      body: {
        waybill: "REV-DELHIVERY-9988",
        status: "Picked Up",
      },
    });

    await shippingController.trackingWebhook(req, res);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockShipment.status, "Picked Up");
    assert.strictEqual(mockOrder.returnStatus, "Picked Up");
  });

  // -------------------------------------------------------------
  // RET-05: Delhivery Webhook receives 'Returned' event (Delivered to warehouse)
  // -------------------------------------------------------------
  test("RET-05: Delhivery Webhook receives Returned event -> Shipment and Order returnStatus update to Returned", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-008",
      user: userId,
      orderStatus: "delivered",
      returnStatus: "Picked Up",
      statusHistory: [],
      save: async function () { return this; },
    };

    const mockShipment = {
      _id: new mongoose.Types.ObjectId(),
      order: mockOrder._id,
      waybillNumber: "REV-DELHIVERY-9988",
      paymentMode: "Pickup",
      status: "Picked Up",
      save: async function () { return this; },
    };

    Shipment.findOne = async () => mockShipment;
    Order.findById = async () => mockOrder;

    const { req, res } = createMockReqRes({
      body: {
        waybill: "REV-DELHIVERY-9988",
        status: "Returned",
      },
    });

    await shippingController.trackingWebhook(req, res);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockShipment.status, "Returned");
    assert.strictEqual(mockOrder.returnStatus, "Returned");
  });

  // -------------------------------------------------------------
  // EXC-01: Admin processes Exchange after return
  // -------------------------------------------------------------
  test("EXC-01: Admin processes Exchange -> original order returnStatus=Exchanged and zero-dollar replacement order is created", async () => {
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderNumber: "NC-TEST-ORIGINAL",
      user: userId,
      orderStatus: "delivered",
      returnStatus: "Returned",
      isExchange: true,
      shippingAddress: {
        fullName: "John Doe",
        addressLine1: "123 High Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        phone: "9876543210",
      },
      items: [
        {
          product: productId,
          name: "Classic Blazer - Size M",
          price: 4999,
          quantity: 1,
          size: "M",
          color: "Navy",
        },
      ],
      paymentMethod: "razorpay",
      totalPrice: 4999,
      statusHistory: [],
      save: async function () { return this; },
    };

    Order.findById = async () => mockOrder;

    let replacementOrderSaved = null;
    Order.prototype.save = async function () {
      replacementOrderSaved = this;
      return this;
    };

    const { req, res, next } = createMockReqRes({
      user: adminUser,
      params: { id: mockOrder._id.toString() },
      body: {
        items: [
          {
            product: productId,
            name: "Classic Blazer - Size L",
            price: 0,
            quantity: 1,
            size: "L",
            color: "Navy",
          },
        ],
      },
    });

    await orderController.processExchange(req, res, next);

    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(mockOrder.returnStatus, "Exchanged");
    assert.ok(replacementOrderSaved, "A replacement order must be saved");
    assert.strictEqual(replacementOrderSaved.totalPrice, 0, "Replacement order should be zero dollar");
    assert.strictEqual(replacementOrderSaved.isPaid, true);
    assert.strictEqual(replacementOrderSaved.orderStatus, "processing");
    assert.match(replacementOrderSaved.orderNumber, /^NC-EXC-/);
    assert.strictEqual(replacementOrderSaved.items[0].size, "L", "Replacement item should reflect new size");
  });
});
