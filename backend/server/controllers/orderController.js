const mongoose = require("mongoose");
const Order = require("../models/Order");
const SubOrder = require("../models/SubOrder");
const Payout = require("../models/Payout");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");
const {
  loadCustomerContext,
  emailCustomerOrderStatusUpdate,
  emailCustomerOrderCancelled,
  emailCustomerOrderConfirmation,
  emailCustomerShipmentTracking,
} = require("../utils/orderCustomerNotifications");
const { assertForwardStatusTransition } = require("../utils/orderStatusRules");
const {
  SHIPPING_PLATFORMS,
  getPlatformById,
  buildTrackingUrl,
  buildDefaultShipmentEmailText,
} = require("../config/shippingPlatforms");
const Shipment = require("../models/Shipment");
const delhiveryService = require("../services/delhiveryService");
const { restoreStockForItems, deductStockForItems } = require("../services/stockService");
const { refundPayment } = require("../services/paymentService");
const {
  buildCheckoutSnapshot,
  createOrderFromSnapshot,
  afterOrderPlaced,
  pickShippingAddress,
  assertShippingAddress,
} = require("../services/checkoutService");

const TAX_RATE = Number(process.env.TAX_RATE) || 0; // 0 default for GST-inclusive catalog prices
const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD) || 999;
const FLAT_SHIPPING_RATE = Number(process.env.FLAT_SHIPPING_RATE) || 99;

const calculateTotals = (cart) => {
  const itemsPrice = cart.subtotal;

  let discountAmount = 0;
  if (cart.coupon?.code) {
    if (cart.coupon.discountType === "percentage") {
      discountAmount = (itemsPrice * cart.coupon.discountValue) / 100;
    } else {
      discountAmount = cart.coupon.discountValue;
    }
  }

  const discountedSubtotal = Math.max(itemsPrice - discountAmount, 0);
  const taxPrice = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;
  const shippingPrice = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const totalPrice = Math.round((discountedSubtotal + taxPrice + shippingPrice) * 100) / 100;

  return { itemsPrice, discountAmount, taxPrice, shippingPrice, totalPrice };
};



// @desc    Create a payment intent (deprecated - Stripe removed)
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  throw ApiError.badRequest("Stripe payments are no longer supported. Please use Razorpay via /api/payments/razorpay/order.");
});

// @desc    Place a Cash on Delivery order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (paymentMethod === "stripe") {
    throw ApiError.badRequest("Stripe payments are no longer supported. Please use Razorpay or Cash on Delivery.");
  }

  if (paymentMethod !== "cod") {
    throw ApiError.badRequest("Online payments must be initiated via /api/payments/razorpay/order.");
  }

  const shipping = pickShippingAddress(shippingAddress);
  assertShippingAddress(shipping);

  const snapshot = await buildCheckoutSnapshot(req.user);

  const order = await createOrderFromSnapshot({
    user: req.user,
    snapshot,
    shippingAddress: shipping,
    paymentMethod: "cod",
  });

  await afterOrderPlaced({ user: req.user, order });

  return sendSuccess(res, 201, "Order placed successfully with Cash on Delivery", order);
});



// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const orders = await Order.find({ user: req.user._id })
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments({ user: req.user._id });

  return sendSuccess(res, 200, "Orders fetched successfully", orders, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// @desc    Get single order by id
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === "seller";
  const isAdmin = req.user.role === "admin";

  // If caller is seller, look up their specific SubOrder
  if (isSeller) {
    let subOrderQuery = mongoose.isValidObjectId(req.params.id)
      ? { $or: [{ _id: req.params.id }, { parentOrder: req.params.id }] }
      : { subOrderNumber: req.params.id };

    const subOrder = await SubOrder.findOne({ ...subOrderQuery, seller: req.user._id })
      .populate("customer", "name email phone")
      .populate("items.product", "title slug images");

    if (subOrder) {
      const formatted = subOrder.toObject();
      formatted.orderNumber = subOrder.subOrderNumber;
      formatted.user = subOrder.customer;
      return sendSuccess(res, 200, "Sub-order fetched successfully", formatted);
    }
  }

  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "title slug images")
    .populate("subOrders");

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.user._id.toString() !== req.user._id.toString() && !isSeller && !isAdmin) {
    throw ApiError.forbidden("You do not have access to this order");
  }

  // If seller queried parent order ID but has no items in it
  if (isSeller && !isAdmin) {
    const sellerSubOrder = await SubOrder.findOne({ parentOrder: order._id, seller: req.user._id })
      .populate("customer", "name email phone")
      .populate("items.product", "title slug images");
    if (!sellerSubOrder) {
      throw ApiError.forbidden("You do not have items in this order");
    }
    const formatted = sellerSubOrder.toObject();
    formatted.orderNumber = sellerSubOrder.subOrderNumber;
    formatted.user = sellerSubOrder.customer;
    return sendSuccess(res, 200, "Sub-order fetched successfully", formatted);
  }

  return sendSuccess(res, 200, "Order fetched successfully", order);
});

// @desc    Cancel an order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel or POST /api/orders/:id/cancel-request
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  let order = await Order.findById(req.params.id);

  if (!order) throw ApiError.notFound("Order not found");
  
  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdminOrSeller = req.user.role === "admin" || req.user.role === "seller";

  if (!isOwner && !isAdminOrSeller) {
    throw ApiError.forbidden("You do not have access to this order");
  }

  // Atomically claim cancellation to prevent concurrent race conditions
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      cancellationClaimedAt: null,
      orderStatus: { $in: ["pending", "processing"] },
    },
    { $set: { cancellationClaimedAt: new Date() } },
    { new: true }
  );

  if (!claimedOrder) {
    const existing = await Order.findById(req.params.id);
    if (!existing) throw ApiError.notFound("Order not found");
    if (existing.cancellationClaimedAt || ["cancelled", "refunded"].includes(existing.orderStatus)) {
      throw ApiError.badRequest("Order is already cancelled or cancellation is in progress");
    }
    throw ApiError.badRequest("Cannot cancel an order that has already shipped or delivered");
  }

  order = claimedOrder;

  // Cancel active shipment record
  const shipment = await Shipment.findOne({
    order: order._id,
    status: { $nin: ["Cancelled", "Returned", "RTO"] },
  });

  if (shipment) {
    if (shipment.waybillNumber) {
      try {
        await delhiveryService.cancelOrder(shipment.waybillNumber);
      } catch (delhiveryErr) {
        console.error("[Delhivery] Cancellation API call failed:", delhiveryErr.message);
      }
    }
    shipment.status = "Cancelled";
    await shipment.save();
  }

  const reason = req.body.reason || (isAdminOrSeller && !isOwner ? "Cancelled by admin" : "Cancelled by customer");

  // Refund if online payment was made via Razorpay
  if (order.paymentMethod === "razorpay" && order.isPaid && order.payment?.razorpayPaymentId) {
    try {
      const refund = await refundPayment({
        paymentId: order.payment.razorpayPaymentId,
        amountPaise: order.payment.amount,
        reason,
        orderId: order._id,
      });
      order.orderStatus = "refunded";
      order.paymentStatus = "refunded";
      if (!order.payment.refunds) order.payment.refunds = [];
      order.payment.refunds.push({
        refundId: refund?.id,
        amount: order.payment.amount,
        status: refund?.status || "processed",
      });
      order.statusHistory.push({ status: "refunded", note: `Refund issued via Razorpay: ${reason}` });
    } catch (err) {
      await Order.findByIdAndUpdate(order._id, { $set: { cancellationClaimedAt: null } });
      throw ApiError.internal("Refund failed: " + (err?.error?.description || err.message));
    }
  } else if (order.paymentMethod === "stripe" && order.isPaid) {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: `Legacy Stripe order cancelled: ${reason} (Manual refund required if paid)` });
  } else {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: reason });
  }

  // Restore inventory AFTER refund succeeds
  await restoreStockForItems(order.items);

  order.cancelReason = reason;
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Order Cancelled",
    message: `Your order ${order.orderNumber} has been cancelled. Reason: ${reason}`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  await emailCustomerOrderCancelled(order, order.cancelReason).catch((err) =>
    console.error("[EmailService] Order cancellation email error:", err.message)
  );

  return sendSuccess(res, 200, "Order cancelled successfully", order);
});

// @desc    Admin cancel order
// @route   POST /api/orders/:id/admin-cancel
// @access  Private/Admin
const adminCancelOrder = asyncHandler(async (req, res) => {
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      cancellationClaimedAt: null,
      orderStatus: { $in: ["pending", "processing"] },
    },
    { $set: { cancellationClaimedAt: new Date() } },
    { new: true }
  );

  if (!claimedOrder) {
    const existing = await Order.findById(req.params.id);
    if (!existing) throw ApiError.notFound("Order not found");
    if (existing.cancellationClaimedAt || ["cancelled", "refunded"].includes(existing.orderStatus)) {
      throw ApiError.badRequest("Order is already cancelled or cancellation is in progress");
    }
    throw ApiError.badRequest("Cannot cancel an order that has already shipped or delivered");
  }

  const order = claimedOrder;

  const shipment = await Shipment.findOne({
    order: order._id,
    status: { $nin: ["Cancelled", "Returned", "RTO"] },
  });

  if (shipment) {
    if (shipment.waybillNumber) {
      try {
        await delhiveryService.cancelOrder(shipment.waybillNumber);
      } catch (delhiveryErr) {
        console.error("[Delhivery] Admin cancellation API call failed:", delhiveryErr.message);
      }
    }
    shipment.status = "Cancelled";
    await shipment.save();
  }

  const reason = req.body.reason || "Cancelled by admin";

  if (order.paymentMethod === "razorpay" && order.isPaid && order.payment?.razorpayPaymentId) {
    try {
      const refund = await refundPayment({
        paymentId: order.payment.razorpayPaymentId,
        amountPaise: order.payment.amount,
        reason,
        orderId: order._id,
      });
      order.orderStatus = "refunded";
      order.paymentStatus = "refunded";
      if (!order.payment.refunds) order.payment.refunds = [];
      order.payment.refunds.push({
        refundId: refund?.id,
        amount: order.payment.amount,
        status: refund?.status || "processed",
      });
      order.statusHistory.push({ status: "refunded", note: `Refund issued via Razorpay: ${reason}` });
    } catch (err) {
      await Order.findByIdAndUpdate(order._id, { $set: { cancellationClaimedAt: null } });
      throw ApiError.internal("Refund failed: " + (err?.error?.description || err.message));
    }
  } else if (order.paymentMethod === "stripe" && order.isPaid) {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: `Legacy Stripe order cancelled: ${reason} (Manual refund required if paid)` });
  } else {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: reason });
  }

  await restoreStockForItems(order.items);

  order.cancelReason = reason;
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Order Cancelled by Admin",
    message: `Your order ${order.orderNumber} was cancelled by administration. Reason: ${reason}`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  await emailCustomerOrderCancelled(order, reason).catch((err) =>
    console.error("[EmailService] Admin cancellation email error:", err.message)
  );

  return sendSuccess(res, 200, "Order cancelled by admin successfully", order);
});

// @desc    Customer requests return or exchange
// @route   POST /api/orders/:id/return-request
// @access  Private
const returnRequest = asyncHandler(async (req, res) => {
  const { reason, isExchange, exchangeDetails } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin" && req.user.role !== "seller") {
    throw ApiError.forbidden("You do not have access to this order");
  }

  // Order must be delivered
  if (order.orderStatus !== "delivered") {
    throw ApiError.badRequest("Order must be delivered before requesting a return or exchange");
  }

  // Check 7-day policy
  const deliveredDate = order.deliveredAt || order.updatedAt;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - new Date(deliveredDate).getTime() > sevenDaysInMs) {
    throw ApiError.badRequest("Return window expired (must be within 7 days of delivery)");
  }

  // Check if already requested or processed
  if (order.returnStatus && order.returnStatus !== "Not Requested") {
    throw ApiError.badRequest("A return or exchange request has already been submitted for this order");
  }

  if (!reason) {
    throw ApiError.badRequest("Please provide a reason for the return or exchange");
  }

  order.returnStatus = "Requested";
  order.returnReason = reason;
  order.isExchange = Boolean(isExchange);
  if (exchangeDetails) {
    order.exchangeDetails = exchangeDetails;
  }

  order.statusHistory.push({
    status: order.orderStatus,
    note: isExchange ? `Exchange requested: ${reason}` : `Return requested: ${reason}`,
  });

  await order.save();

  await Notification.create({
    user: order.user,
    title: isExchange ? "Exchange Request Submitted" : "Return Request Submitted",
    message: `Your ${isExchange ? "exchange" : "return"} request for order ${order.orderNumber} has been received and is awaiting admin approval.`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  return sendSuccess(res, 200, `${isExchange ? "Exchange" : "Return"} request submitted successfully`, order);
});

// @desc    Admin approves return & schedules Delhivery reverse pickup
// @route   POST /api/orders/:id/approve-return
// @access  Private/Admin
const approveReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  if (order.returnStatus !== "Requested") {
    throw ApiError.badRequest("No pending return request to approve for this order");
  }

  const pickupWarehouse = req.body.pickupWarehouseName || process.env.DELHIVERY_PICKUP_LOCATION || "Primary Warehouse";
  const warehousePin = req.body.warehousePincode || process.env.DELHIVERY_WAREHOUSE_PINCODE || "110001";

  const reversePayload = {
    name: order.shippingAddress.fullName,
    add: `${order.shippingAddress.addressLine1} ${order.shippingAddress.addressLine2 || ""}`.trim(),
    pin: order.shippingAddress.postalCode,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    country: order.shippingAddress.country || "India",
    phone: order.shippingAddress.phone,
    order: `${order.orderNumber}-RET`,
    payment_mode: "Pickup",
    return_pin: warehousePin,
    pickup_location: {
      name: pickupWarehouse,
    },
    products_desc: order.items.map((i) => i.name).join(", "),
    total_amount: order.totalPrice,
    cod_amount: 0,
  };

  // Delhivery reverse pickup dispatch paused — assigning standard return waybill
  const waybillNumber = `REV-${Date.now()}`;
  /*
  let reversePickupResult = null;
  try {
    reversePickupResult = await delhiveryService.createReversePickup(reversePayload);
    if (reversePickupResult?.packages && reversePickupResult.packages.length > 0) {
      waybillNumber = reversePickupResult.packages[0].waybill;
    }
  } catch (delhiveryErr) {
    console.error("[Delhivery] Reverse pickup error:", delhiveryErr.response?.data || delhiveryErr.message);
  }
  */

  // Create reverse Shipment record
  const returnShipment = new Shipment({
    order: order._id,
    vendor: req.user?._id || order.user,
    pickupWarehouseName: pickupWarehouse,
    waybillNumber,
    paymentMode: "Pickup",
    status: "Manifested",
    isTest: process.env.DELHIVERY_ENV !== "production",
    courier: "delhivery",
  });
  await returnShipment.save();

  order.returnStatus = "Approved";
  order.statusHistory.push({
    status: order.orderStatus,
    note: `Return approved by admin. Reverse pickup scheduled with waybill: ${waybillNumber}`,
  });
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Return Request Approved",
    message: `Your return request for order ${order.orderNumber} has been approved. Courier pickup AWB: ${waybillNumber}.`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  await emailCustomerOrderStatusUpdate(order, {
    newStatus: order.orderStatus,
    note: `Return approved. Courier reverse pickup AWB: ${waybillNumber}`,
  }).catch((err) => console.error("[EmailService] Return approval email error:", err.message));

  return sendSuccess(res, 200, "Return approved and reverse pickup scheduled successfully", {
    order,
    shipment: returnShipment,
    delhivery: null,
  });
});

// @desc    Admin processes exchange and generates replacement order
// @route   POST /api/orders/:id/process-exchange
// @access  Private/Admin
const processExchange = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  if (!order.isExchange) {
    throw ApiError.badRequest("This order was not requested as an exchange");
  }

  if (!["Approved", "Picked Up", "Returned"].includes(order.returnStatus)) {
    throw ApiError.badRequest("Return must be approved or picked up before processing exchange");
  }

  order.returnStatus = "Exchanged";

  // Create zero-dollar replacement order
  const replacementOrderNumber =
    "NC-EXC-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);

  const replacementItems = req.body.items || order.items.map((item) => ({
    product: item.product,
    variantId: item.variantId,
    name: item.name,
    image: item.image,
    price: 0,
    color: item.color,
    size: item.size,
    quantity: item.quantity,
  }));

  const replacementOrder = new Order({
    orderNumber: replacementOrderNumber,
    user: order.user,
    items: replacementItems,
    shippingAddress: order.shippingAddress,
    paymentMethod: order.paymentMethod,
    totalPrice: 0,
    itemsPrice: 0,
    taxPrice: 0,
    shippingPrice: 0,
    discountAmount: 0,
    isPaid: true,
    paidAt: new Date(),
    orderStatus: "processing",
    statusHistory: [
      {
        status: "processing",
        note: `Replacement order for original order ${order.orderNumber}`,
      },
    ],
  });

  await replacementOrder.save();

  // Deduct stock for replacement items if available
  try {
    await deductStockForItems(replacementOrder.items);
  } catch (stockErr) {
    console.warn("[Exchange] Note: Stock deduction for replacement items skipped/failed:", stockErr.message);
  }

  order.statusHistory.push({
    status: order.orderStatus,
    note: `Exchange processed. Replacement order ${replacementOrder.orderNumber} generated.`,
  });
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Exchange Replacement Order Placed",
    message: `A replacement order ${replacementOrder.orderNumber} has been created for your exchange.`,
    type: "order",
    link: `/dashboard/orders/${replacementOrder._id}`,
  }).catch(() => {});

  await Promise.allSettled([
    emailCustomerOrderConfirmation(replacementOrder).catch((err) =>
      console.error("[EmailService] Replacement order confirmation email error:", err.message)
    ),
    emailCustomerOrderStatusUpdate(order, {
      newStatus: order.orderStatus,
      note: `Exchange processed. Replacement order ${replacementOrder.orderNumber} is being prepared.`,
    }).catch((err) => console.error("[EmailService] Exchange processed email error:", err.message)),
  ]);

  return sendSuccess(res, 200, "Exchange processed and replacement order created", {
    originalOrder: order,
    replacementOrder,
  });
});

// @desc    Get all orders (admin or seller)
// @route   GET /api/orders
// @access  Private/Admin/Seller
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  // Strict tenant scoping for sellers: return ONLY their SubOrders
  if (req.user.role === "seller") {
    const subFilter = { seller: req.user._id };
    if (req.query.status) subFilter.orderStatus = req.query.status;

    const total = await SubOrder.countDocuments(subFilter);
    const subOrders = await SubOrder.find(subFilter)
      .populate("customer", "name email phone")
      .populate("items.product", "title slug images")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit);

    // Format sub-order objects so seller portal renders seamlessly
    const formatted = subOrders.map((so) => {
      const obj = so.toObject();
      obj.orderNumber = so.subOrderNumber; // Alias for UI table
      obj.user = so.customer;
      return obj;
    });

    return sendSuccess(res, 200, "Seller orders fetched successfully", formatted, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .populate("subOrders")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  return sendSuccess(res, 200, "Orders fetched successfully", orders, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

// @desc    Update order status (admin or seller)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Seller
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;
  const isSeller = req.user.role === "seller";

  // If seller is updating, find and update their specific SubOrder
  if (isSeller) {
    const subQuery = mongoose.isValidObjectId(req.params.id)
      ? { $or: [{ _id: req.params.id }, { parentOrder: req.params.id }] }
      : { subOrderNumber: req.params.id };

    const subOrder = await SubOrder.findOne({ ...subQuery, seller: req.user._id });
    if (!subOrder) throw ApiError.notFound("Sub-order not found or unauthorized");

    const prevStatus = subOrder.orderStatus;
    if (status) {
      assertForwardStatusTransition(prevStatus, status);
      subOrder.orderStatus = status;
      subOrder.statusHistory.push({ status, note: note || `Updated by seller` });
      if (status === "delivered") {
        subOrder.isDelivered = true;
        subOrder.deliveredAt = new Date();
      }
    }

    if (trackingNumber !== undefined) {
      subOrder.trackingNumber = String(trackingNumber).trim();
      subOrder.trackingAssignedAt = new Date();
    }

    await subOrder.save();

    // Check sibling SubOrders and sync parent Order status
    if (subOrder.parentOrder) {
      const siblings = await SubOrder.find({ parentOrder: subOrder.parentOrder });
      const parentOrder = await Order.findById(subOrder.parentOrder);
      if (parentOrder && siblings.length > 0) {
        const allDelivered = siblings.every((s) => s.orderStatus === "delivered");
        const allShipped = siblings.every((s) => ["shipped", "delivered"].includes(s.orderStatus));
        if (!Array.isArray(parentOrder.statusHistory)) parentOrder.statusHistory = [];
        if (allDelivered && parentOrder.orderStatus !== "delivered") {
          parentOrder.orderStatus = "delivered";
          parentOrder.isDelivered = true;
          parentOrder.deliveredAt = new Date();
          parentOrder.statusHistory.push({ status: "delivered", note: "All seller packages delivered" });
          await parentOrder.save();
        } else if (allShipped && !["shipped", "delivered"].includes(parentOrder.orderStatus)) {
          parentOrder.orderStatus = "shipped";
          parentOrder.statusHistory.push({ status: "shipped", note: "All seller packages dispatched" });
          await parentOrder.save();
        }
      }
    }

    const formatted = subOrder.toObject();
    formatted.orderNumber = subOrder.subOrderNumber;
    return sendSuccess(res, 200, "Sub-order status updated successfully", formatted);
  }

  // Admin global order update
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  const prevStatus = order.orderStatus;

  if (status) {
    assertForwardStatusTransition(prevStatus, status);
    // If order is transitioning TO cancelled/refunded from an active status, restore stock
    if (
      ["cancelled", "refunded"].includes(status) &&
      !["cancelled", "refunded"].includes(prevStatus)
    ) {
      await restoreStockForItems(order.items);
    }
    // If order was cancelled/refunded and is reinstated to an active status, re-deduct stock
    else if (
      !["cancelled", "refunded"].includes(status) &&
      ["cancelled", "refunded"].includes(prevStatus)
    ) {
      await deductStockForItems(order.items);
    }

    order.orderStatus = status;
    order.statusHistory.push({ status, note: note || "" });
  }

  const trackingTrimmed = typeof trackingNumber === "string" ? trackingNumber.trim() : trackingNumber;
  const isTrackingUpdated = Boolean(trackingTrimmed && trackingTrimmed !== order.trackingNumber);

  if (trackingTrimmed !== undefined) {
    order.trackingNumber = trackingTrimmed;
  }

  if (isTrackingUpdated && !status) {
    order.statusHistory.push({
      status: order.orderStatus,
      note: note || `Tracking/AWB assigned: ${trackingTrimmed}`,
    });
  }

  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  await order.save();

  return sendSuccess(res, 200, "Order status updated successfully", order);
});

// @desc    List manual shipping platforms + default email template snippet
// @route   GET /api/orders/shipment/platforms
// @access  Private/Seller
const getShipmentPlatforms = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Shipping platforms retrieved", SHIPPING_PLATFORMS);
});

// @desc    Preview default shipment email body for an order
// @route   POST /api/orders/:id/shipment/preview-email
// @access  Private/Seller
const previewShipmentEmail = asyncHandler(async (req, res) => {
  let order = null;
  if (req.user.role === "seller") {
    order = await SubOrder.findOne({
      $or: [{ _id: req.params.id }, { subOrderNumber: req.params.id }],
      seller: req.user._id,
    });
  }
  if (!order) {
    order = await Order.findById(req.params.id);
  }
  if (!order) throw ApiError.notFound("Order not found");

  const trackingNumber = (req.body.trackingNumber || order.trackingNumber || "").trim();
  const platformId = req.body.shippingPlatform || order.shippingPlatform || "other";
  const platform = getPlatformById(platformId);
  const platformLabel =
    req.body.shippingPlatformLabel?.trim() || platform?.label || order.shippingPlatformLabel || "Courier";
  const trackingUrl = buildTrackingUrl(
    platformId,
    trackingNumber,
    req.body.trackingUrl || order.trackingUrl
  );

  const ctx = await loadCustomerContext(order);
  const recipientName =
    ctx?.recipientUser?.name || order.shippingAddress?.fullName || "Customer";
  const emailBody = buildDefaultShipmentEmailText({
    recipientName,
    orderNumber: order.subOrderNumber || order.orderNumber,
    platformLabel,
    trackingNumber,
    trackingUrl,
  });

  const defaultSubject = `Order #${order.subOrderNumber || order.orderNumber} shipped — ${platformLabel} tracking ${trackingNumber}`;

  return sendSuccess(res, 200, "Shipment email preview generated", {
    emailSubject: defaultSubject,
    emailBody,
    platformLabel,
    trackingUrl,
    recipientEmail: ctx?.email || null,
  });
});

const applyShipmentFieldsToOrder = (order, body) => {
  const trackingNumber = String(body.trackingNumber || "").trim();
  if (!trackingNumber) {
    throw ApiError.badRequest("Tracking / AWB number is required");
  }

  const platformId = body.shippingPlatform || "other";
  const platform = getPlatformById(platformId);
  const platformLabel =
    body.shippingPlatformLabel?.trim() || platform?.label || "Courier";
  const trackingUrl = buildTrackingUrl(platformId, trackingNumber, body.trackingUrl);

  const isNewTracking = trackingNumber !== order.trackingNumber;

  order.trackingNumber = trackingNumber;
  order.shippingPlatform = platformId;
  order.shippingPlatformLabel = platformLabel;
  order.trackingUrl = trackingUrl;
  if (isNewTracking || !order.trackingAssignedAt) {
    order.trackingAssignedAt = new Date();
  }

  if (body.markAsShipped && !["shipped", "delivered", "cancelled", "refunded"].includes(order.orderStatus)) {
    assertForwardStatusTransition(order.orderStatus, "shipped");
    order.orderStatus = "shipped";
    order.statusHistory.push({
      status: "shipped",
      note: body.note || `Dispatched via ${platformLabel}. AWB: ${trackingNumber}`,
    });
  } else if (isNewTracking) {
    order.statusHistory.push({
      status: order.orderStatus,
      note: body.note || `Tracking assigned (${platformLabel}): ${trackingNumber}`,
    });
  }

  return { platformLabel, trackingUrl, isNewTracking };
};

// @desc    Save shipment / tracking details (no customer email)
// @route   PUT /api/orders/:id/shipment
// @access  Private/Seller
const saveOrderShipment = asyncHandler(async (req, res) => {
  let order = null;
  let isSubOrder = false;

  if (req.user.role === "seller") {
    order = await SubOrder.findOne({
      $or: [{ _id: req.params.id }, { subOrderNumber: req.params.id }],
      seller: req.user._id,
    });
    if (order) isSubOrder = true;
  }
  if (!order) {
    order = await Order.findById(req.params.id);
  }
  if (!order) throw ApiError.notFound("Order not found");

  const { platformLabel, trackingUrl } = applyShipmentFieldsToOrder(order, req.body);
  await order.save();

  if (isSubOrder && order.parentOrder) {
    const siblings = await SubOrder.find({ parentOrder: order.parentOrder });
    const allShipped = siblings.every((s) => ["shipped", "delivered"].includes(s.orderStatus));
    if (allShipped) {
      await Order.findByIdAndUpdate(order.parentOrder, {
        $set: { orderStatus: "shipped" },
        $push: { statusHistory: { status: "shipped", note: "All seller packages dispatched" } },
      });
    }
  }

  const customerId = order.customer || order.user;
  if (customerId) {
    await Notification.create({
      user: customerId,
      title: "Tracking details added",
      message: `Tracking for order #${order.subOrderNumber || order.orderNumber} is available (${platformLabel}: ${order.trackingNumber}).`,
      type: "order",
      link: `/dashboard/orders/${order.parentOrder || order._id}`,
    }).catch(() => {});
  }

  return sendSuccess(res, 200, "Shipment details saved", {
    order,
    platformLabel,
    trackingUrl,
  });
});

// @desc    Save shipment details + send customizable tracking email + optional in-app notification
// @route   POST /api/orders/:id/shipment/notify
// @access  Private/Seller
const notifyOrderShipment = asyncHandler(async (req, res) => {
  let order = null;
  let isSubOrder = false;

  if (req.user.role === "seller") {
    order = await SubOrder.findOne({
      $or: [{ _id: req.params.id }, { subOrderNumber: req.params.id }],
      seller: req.user._id,
    });
    if (order) isSubOrder = true;
  }
  if (!order) {
    order = await Order.findById(req.params.id);
  }
  if (!order) throw ApiError.notFound("Order not found");

  const { emailBody, emailSubject, markAsShipped = true, sendInAppNotification = true } = req.body;

  if (!String(emailBody || "").trim()) {
    throw ApiError.badRequest("Email message body is required before sending");
  }

  const { platformLabel, trackingUrl } = applyShipmentFieldsToOrder(order, {
    ...req.body,
    markAsShipped,
  });
  await order.save();

  if (isSubOrder && order.parentOrder) {
    const siblings = await SubOrder.find({ parentOrder: order.parentOrder });
    const allShipped = siblings.every((s) => ["shipped", "delivered"].includes(s.orderStatus));
    if (allShipped) {
      await Order.findByIdAndUpdate(order.parentOrder, {
        $set: { orderStatus: "shipped" },
        $push: { statusHistory: { status: "shipped", note: "All seller packages dispatched" } },
      });
    }
  }

  const ctx = await loadCustomerContext(order);

  if (sendInAppNotification && order.user) {
    await Notification.create({
      user: order.user,
      title: "Your order has shipped",
      message: `Order #${order.orderNumber} dispatched via ${platformLabel}. Tracking: ${order.trackingNumber}.`,
      type: "order",
      link: `/dashboard/orders/${order._id}`,
    }).catch(() => {});
  }

  let dispatchResult = null;
  let emailSent = false;
  let emailError = null;

  if (ctx?.email) {
    try {
      dispatchResult = await emailCustomerShipmentTracking(order, {
        platformLabel,
        trackingNumber: order.trackingNumber,
        trackingUrl,
        emailBody: String(emailBody).trim(),
        emailSubject: emailSubject?.trim(),
      });

      emailSent = Boolean(dispatchResult?.success);
      if (!emailSent) {
        emailError = dispatchResult?.error || "Email delivery skipped or failed.";
      }
    } catch (err) {
      console.error("[notifyOrderShipment] Email dispatch error:", err.message);
      emailError = err.message || "Failed to send shipment email";
    }
  } else {
    emailError = "No customer email address on file";
  }

  const msg = emailSent
    ? `Shipment notification sent to ${ctx.email}`
    : `Tracking assigned & order marked as Shipped! (${emailError})`;

  return sendSuccess(res, 200, msg, {
    recipient: ctx?.email || null,
    order,
    emailSent,
    emailError,
    dispatchResult,
  });
});

// @desc    Send shipping / tracking email manually
// @route   POST /api/orders/:id/send-tracking-email
// @access  Private/Seller
const sendTrackingEmail = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  if (!order.trackingNumber) {
    throw ApiError.badRequest("Order does not have a tracking / AWB number assigned yet.");
  }

  const ctx = await loadCustomerContext(order);
  if (!ctx?.email) {
    throw ApiError.badRequest("No valid customer email address found for this order.");
  }

  const platformLabel = order.shippingPlatformLabel || "Courier";
  const trackingUrl = order.trackingUrl || "";
  const emailBody =
    buildDefaultShipmentEmailText({
      recipientName: ctx.recipientUser?.name,
      orderNumber: order.orderNumber,
      platformLabel,
      trackingNumber: order.trackingNumber,
      trackingUrl,
    });

  const dispatchResult = await emailCustomerShipmentTracking(order, {
    platformLabel,
    trackingNumber: order.trackingNumber,
    trackingUrl,
    emailBody,
  });

  if (!dispatchResult?.success) {
    throw ApiError.internal(
      dispatchResult?.error || "Failed to send shipping email. Check SMTP configuration and email logs."
    );
  }

  return sendSuccess(res, 200, `Shipping email sent successfully to ${ctx.email}`, {
    recipient: ctx.email,
    trackingNumber: order.trackingNumber,
    dispatchResult,
  });
});

// @desc    Public tracking endpoint for orders without login
// @route   POST /api/orders/track-public
// @access  Public
const trackOrderPublic = asyncHandler(async (req, res) => {
  const { orderNumber, phoneOrEmail } = req.body;
  if (!orderNumber || !phoneOrEmail) {
    throw ApiError.badRequest("Please provide both Order Number and Phone or Email");
  }

  const cleanOrderNumber = orderNumber.trim().toUpperCase();
  const cleanInput = phoneOrEmail.trim().toLowerCase();

  const order = await Order.findOne({ orderNumber: cleanOrderNumber })
    .populate("user", "name email phone")
    .lean();

  if (!order) {
    throw ApiError.notFound("No order found matching the provided order number");
  }

  // Verify phone or email match (exact 10 digits for phone to prevent single-digit guess bypass)
  const customerEmail = (order.user?.email || order.shippingAddress?.email || "").toLowerCase();
  const customerPhoneDigits = (order.shippingAddress?.phone || order.user?.phone || "").replace(/[^0-9]/g, "");
  const inputPhoneDigits = cleanInput.replace(/[^0-9]/g, "");

  const emailMatches = customerEmail && customerEmail === cleanInput;
  const phoneMatches =
    inputPhoneDigits.length >= 10 &&
    customerPhoneDigits.length >= 10 &&
    customerPhoneDigits.slice(-10) === inputPhoneDigits.slice(-10);

  if (!emailMatches && !phoneMatches) {
    throw ApiError.badRequest("The phone or email does not match our records for this order number.");
  }

  // Return non-sensitive tracking summary (PII like full customer phone omitted)
  return sendSuccess(res, 200, "Order tracking details retrieved", {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber || null,
    shippingPlatform: order.shippingPlatform || null,
    shippingPlatformLabel: order.shippingPlatformLabel || null,
    trackingUrl: order.trackingUrl || null,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt || null,
    statusHistory: order.statusHistory || [],
    itemsCount: (order.items || []).reduce((acc, i) => acc + i.quantity, 0),
    items: (order.items || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      image: i.image,
      color: i.color,
      size: i.size,
    })),
    shippingCity: order.shippingAddress?.city,
    shippingState: order.shippingAddress?.state,
    shippingPostalCode: order.shippingAddress?.postalCode,
    recipientName: order.shippingAddress?.fullName,
  });
});

module.exports = {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminCancelOrder,
  returnRequest,
  approveReturn,
  processExchange,
  getAllOrders,
  updateOrderStatus,
  sendTrackingEmail,
  getShipmentPlatforms,
  previewShipmentEmail,
  saveOrderShipment,
  notifyOrderShipment,
  trackOrderPublic,
};

