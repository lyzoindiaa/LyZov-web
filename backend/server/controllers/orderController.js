const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const stripe = require("../config/stripe");
const emailService = require("../services/emailService");
const Shipment = require("../models/Shipment");
const delhiveryService = require("../services/delhiveryService");

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

/**
 * Helper to atomically deduct stock for an array of cart/order items.
 * If any item lacks sufficient stock, all previously deducted items in this batch are rolled back.
 */
const deductStockForItems = async (items) => {
  const deducted = [];

  for (const item of items) {
    const qty = Number(item.quantity);
    let updatedProduct = null;

    if (item.variantId) {
      updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          "variants._id": item.variantId,
          "variants.stock": { $gte: qty },
        },
        {
          $inc: {
            "variants.$.stock": -qty,
            numSold: qty,
          },
        },
        { new: true }
      );
    } else {
      updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product,
          isActive: true,
          stock: { $gte: qty },
        },
        {
          $inc: {
            stock: -qty,
            numSold: qty,
          },
        },
        { new: true }
      );
    }

    if (!updatedProduct) {
      // Rollback all items deducted in this transaction
      for (const d of deducted) {
        if (d.variantId) {
          await Product.findOneAndUpdate(
            { _id: d.product, "variants._id": d.variantId },
            {
              $inc: {
                "variants.$.stock": d.quantity,
                numSold: -d.quantity,
              },
            }
          );
        } else {
          await Product.findByIdAndUpdate(d.product, {
            $inc: {
              stock: d.quantity,
              numSold: -d.quantity,
            },
          });
        }
      }

      throw ApiError.badRequest(
        `Insufficient stock for item "${item.name || "selected product"}". Please update your cart.`
      );
    }

    deducted.push({
      product: item.product,
      variantId: item.variantId || null,
      quantity: qty,
    });
  }

  return deducted;
};

/**
 * Helper to restore stock and decrement numSold when an order is cancelled or refunded.
 */
const restoreStockForItems = async (items) => {
  if (!items || !items.length) return;

  for (const item of items) {
    const qty = Number(item.quantity);
    if (item.variantId) {
      await Product.findOneAndUpdate(
        { _id: item.product, "variants._id": item.variantId },
        {
          $inc: {
            "variants.$.stock": qty,
            numSold: -qty,
          },
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          stock: qty,
          numSold: -qty,
        },
      });
    }
  }
};

// @desc    Create a Stripe payment intent for the current cart
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  // Stock check before initiating payment flow
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw ApiError.badRequest(`Product "${item.name}" is no longer available`);
    }

    let availableStock = product.stock;
    if (item.variantId) {
      const variant = product.variants.id(item.variantId);
      if (!variant) {
        throw ApiError.badRequest(`Variant for "${item.name}" is no longer available`);
      }
      availableStock = variant.stock;
    }

    if (availableStock < item.quantity) {
      throw ApiError.badRequest(`Only ${availableStock} item(s) in stock for "${item.name}"`);
    }
  }

  const { totalPrice } = calculateTotals(cart);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100),
    currency: "inr",
    metadata: { userId: req.user._id.toString() },
    automatic_payment_methods: { enabled: true },
  });

  return sendSuccess(res, 200, "Payment intent created", {
    clientSecret: paymentIntent.client_secret,
    totalPrice,
  });
});

// @desc    Place an order (after successful payment or COD)
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, paymentIntentId } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest("Your cart is empty");
  }

  // Pre-validate Stripe payment if applicable
  let paymentResult = {};
  let isPaid = false;

  if (paymentMethod === "stripe") {
    if (!paymentIntentId) throw ApiError.badRequest("Payment intent id is required");
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") {
      throw ApiError.badRequest("Payment has not been completed");
    }
    if (intent.metadata?.userId && intent.metadata.userId !== req.user._id.toString()) {
      throw ApiError.forbidden("Payment intent does not belong to the current authenticated user");
    }
    paymentResult = {
      id: intent.id,
      status: intent.status,
      currency: intent.currency,
      amount: intent.amount / 100,
      amountReceived: (intent.amount_received || intent.amount) / 100,
      updateTime: new Date().toISOString(),
      email: req.user.email,
    };
    isPaid = true;
  }

  // Server-side coupon verification before placing order
  if (cart.coupon?.code) {
    const coupon = await Coupon.findOne({ code: cart.coupon.code.toUpperCase() });
    if (!coupon || !coupon.isValid()) {
      cart.coupon = { code: null, discountType: null, discountValue: 0 };
      await cart.save();
      throw ApiError.badRequest("The applied coupon is no longer valid or has expired.");
    }
    if (coupon.usersUsed.some((u) => u.toString() === req.user._id.toString())) {
      cart.coupon = { code: null, discountType: null, discountValue: 0 };
      await cart.save();
      throw ApiError.badRequest("You have already used this coupon.");
    }
    if (cart.subtotal < coupon.minPurchaseAmount) {
      cart.coupon = { code: null, discountType: null, discountValue: 0 };
      await cart.save();
      throw ApiError.badRequest(`Minimum purchase of ₹${coupon.minPurchaseAmount} required for coupon ${coupon.code}`);
    }
  }

  // Atomically reserve/deduct stock for all cart items
  const deductedItems = await deductStockForItems(cart.items);

  let order;
  try {
    const { itemsPrice, discountAmount, taxPrice, shippingPrice, totalPrice } = calculateTotals(cart);

    order = await Order.create({
      user: req.user._id,
      items: cart.items.map((item) => ({
        product: item.product,
        variantId: item.variantId || null,
        name: item.name,
        image: item.image,
        price: item.price,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      })),
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountAmount,
      couponCode: cart.coupon?.code || null,
      totalPrice,
      isPaid,
      paidAt: isPaid ? new Date() : undefined,
      statusHistory: [{ status: "pending", note: "Order placed" }],
    });
  } catch (err) {
    // If order record creation fails, restore deducted stock
    await restoreStockForItems(deductedItems);
    throw ApiError.internal("Failed to create order: " + err.message);
  }

  if (cart.coupon?.code) {
    await Coupon.findOneAndUpdate(
      { code: cart.coupon.code },
      { $inc: { usedCount: 1 }, $push: { usersUsed: req.user._id } }
    );
  }

  cart.items = [];
  cart.coupon = { code: null, discountType: null, discountValue: 0 };
  await cart.save();

  await Notification.create({
    user: req.user._id,
    title: "Order placed successfully",
    message: `Your order ${order.orderNumber} has been placed and is being processed.`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  });

  // Non-blocking luxury email dispatches
  emailService.sendOrderConfirmation({ order, user: req.user }).catch((err) =>
    console.error("[EmailService] Order confirmation email error:", err.message)
  );
  emailService.sendSellerNewOrder({ order, user: req.user }).catch((err) =>
    console.error("[EmailService] Seller order alert error:", err.message)
  );

  return sendSuccess(res, 201, "Order placed successfully", order);
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
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("items.product", "title slug images");

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "seller" && req.user.role !== "admin") {
    throw ApiError.forbidden("You do not have access to this order");
  }

  return sendSuccess(res, 200, "Order fetched successfully", order);
});

// @desc    Cancel an order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel or POST /api/orders/:id/cancel-request
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) throw ApiError.notFound("Order not found");
  
  const isOwner = order.user.toString() === req.user._id.toString();
  const isAdminOrSeller = req.user.role === "admin" || req.user.role === "seller";

  if (!isOwner && !isAdminOrSeller) {
    throw ApiError.forbidden("You do not have access to this order");
  }

  if (["cancelled", "refunded"].includes(order.orderStatus)) {
    throw ApiError.badRequest("Order is already cancelled");
  }

  if (["shipped", "delivered"].includes(order.orderStatus)) {
    throw ApiError.badRequest("Cannot cancel an order that has already shipped or delivered");
  }

  // Cancel active shipment record (Delhivery API dispatch paused)
  const shipment = await Shipment.findOne({
    order: order._id,
    status: { $nin: ["Cancelled", "Returned", "RTO"] },
  });

  if (shipment) {
    /*
    if (shipment.waybillNumber) {
      try {
        await delhiveryService.cancelOrder(shipment.waybillNumber);
      } catch (delhiveryErr) {
        console.error("[Delhivery] Failed to cancel waybill during order cancellation:", delhiveryErr.message);
      }
    }
    */
    shipment.status = "Cancelled";
    await shipment.save();
  }

  // Restore inventory immediately upon cancellation
  await restoreStockForItems(order.items);

  const reason = req.body.reason || (isAdminOrSeller && !isOwner ? "Cancelled by admin" : "Cancelled by customer");

  // Refund if Stripe payment was made
  if (order.paymentMethod === "stripe" && order.isPaid && order.paymentResult?.id) {
    try {
      await stripe.refunds.create({
        payment_intent: order.paymentResult.id,
      });
      order.orderStatus = "refunded";
      order.statusHistory.push({ status: "refunded", note: `Refund issued via Stripe: ${reason}` });
    } catch (err) {
      throw ApiError.internal("Refund failed: " + err.message);
    }
  } else {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: reason });
  }

  order.cancelReason = reason;
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Order Cancelled",
    message: `Your order ${order.orderNumber} has been cancelled. Reason: ${reason}`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

  // Non-blocking cancellation email to customer
  User.findById(order.user).then((customer) => {
    if (customer) {
      emailService.sendOrderCancelled({ order, user: customer, reason: order.cancelReason }).catch((err) =>
        console.error("[EmailService] Order cancellation email error:", err.message)
      );
    }
  }).catch(() => {});

  return sendSuccess(res, 200, "Order cancelled successfully", order);
});

// @desc    Admin cancel order (triggers Delhivery cancel if waybill exists)
// @route   POST /api/orders/:id/admin-cancel
// @access  Private/Admin
const adminCancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  if (["cancelled", "refunded"].includes(order.orderStatus)) {
    throw ApiError.badRequest("Order is already cancelled");
  }

  const shipment = await Shipment.findOne({
    order: order._id,
    status: { $nin: ["Cancelled", "Returned", "RTO"] },
  });

  if (shipment) {
    /*
    if (shipment.waybillNumber) {
      try {
        await delhiveryService.cancelOrder(shipment.waybillNumber);
      } catch (delhiveryErr) {
        console.error("[Delhivery] Failed to cancel waybill during admin order cancellation:", delhiveryErr.message);
      }
    }
    */
    shipment.status = "Cancelled";
    await shipment.save();
  }

  await restoreStockForItems(order.items);

  const reason = req.body.reason || "Cancelled by admin";

  if (order.paymentMethod === "stripe" && order.isPaid && order.paymentResult?.id) {
    try {
      await stripe.refunds.create({
        payment_intent: order.paymentResult.id,
      });
      order.orderStatus = "refunded";
      order.statusHistory.push({ status: "refunded", note: `Refund issued via Stripe: ${reason}` });
    } catch (err) {
      throw ApiError.internal("Refund failed: " + err.message);
    }
  } else {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: reason });
  }

  order.cancelReason = reason;
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Order Cancelled by Admin",
    message: `Your order ${order.orderNumber} was cancelled by administration. Reason: ${reason}`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  }).catch(() => {});

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

  return sendSuccess(res, 200, "Return approved and reverse pickup scheduled successfully", {
    order,
    shipment: returnShipment,
    delhivery: reversePickupResult,
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

  return sendSuccess(res, 200, "Exchange processed and replacement order created", {
    originalOrder: order,
    replacementOrder,
  });
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  return sendSuccess(res, 200, "Orders fetched successfully", orders, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  const prevStatus = order.orderStatus;

  // Strict Rule: Once an order has been marked "delivered", it cannot be moved back to "pending", "processing", or "shipped"
  if (prevStatus === "delivered" && ["pending", "processing", "shipped"].includes(status)) {
    throw ApiError.badRequest("Order has already been delivered and cannot be reverted to earlier stages (shipped, processing, or pending).");
  }

  if (status) {
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

  if (order.user) {
    await Notification.create({
      user: order.user,
      title: isTrackingUpdated ? "Tracking details assigned" : "Order status updated",
      message: isTrackingUpdated
        ? `Tracking number ${trackingTrimmed} assigned to order #${order.orderNumber}.`
        : `Your order #${order.orderNumber} status is now: ${status || order.orderStatus}.`,
      type: "order",
      link: `/dashboard/orders/${order._id}`,
    }).catch(() => {});
  }

  // Automated notification email to customer whenever status OR tracking number is updated
  if (status || isTrackingUpdated) {
    const statusToSend = status || order.orderStatus;
    const finalTracking = trackingTrimmed !== undefined ? trackingTrimmed : order.trackingNumber;

    const userPromise = order.user ? User.findById(order.user) : Promise.resolve(null);
    userPromise
      .then((customer) => {
        const recipientUser = customer || {
          name: order.shippingAddress?.fullName || "Valued Customer",
          email: order.shippingAddress?.email,
        };

        if (recipientUser.email || customer?.email || order.shippingAddress?.email) {
          emailService
            .sendOrderStatusUpdate({
              order,
              user: recipientUser,
              newStatus: statusToSend,
              note: note || (isTrackingUpdated && !status ? `Tracking ID assigned: ${finalTracking}` : ""),
              trackingNumber: finalTracking,
            })
            .then(() => {
              console.log(
                `[EmailService] Automated tracking/status update email sent for order #${order.orderNumber} to ${
                  recipientUser.email || order.shippingAddress?.email
                }`
              );
            })
            .catch((err) =>
              console.error("[EmailService] Order status update email error:", err.message)
            );
        }
      })
      .catch((err) => {
        console.error("[EmailService] Customer lookup error:", err.message);
      });
  }

  return sendSuccess(res, 200, "Order status updated successfully", order);
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

  // Verify phone or email match
  const customerEmail = (order.user?.email || order.shippingAddress?.email || "").toLowerCase();
  const customerPhone = (order.shippingAddress?.phone || order.user?.phone || "").replace(/[^0-9]/g, "");
  const inputPhone = cleanInput.replace(/[^0-9]/g, "");

  const emailMatches = customerEmail && customerEmail === cleanInput;
  const phoneMatches = inputPhone && customerPhone && (customerPhone.endsWith(inputPhone) || inputPhone.endsWith(customerPhone));

  if (!emailMatches && !phoneMatches) {
    throw ApiError.badRequest("The phone or email does not match our records for this order number.");
  }

  // Return non-sensitive tracking summary
  return sendSuccess(res, 200, "Order tracking details retrieved", {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber || null,
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
    customerPhone: order.shippingAddress?.phone,
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
  trackOrderPublic,
};

