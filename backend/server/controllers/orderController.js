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

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_RATE = 9.99;

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

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) throw ApiError.notFound("Order not found");
  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You do not have access to this order");
  }
  if (!["pending", "processing"].includes(order.orderStatus)) {
    throw ApiError.badRequest("This order can no longer be cancelled");
  }

  // Restore inventory immediately upon cancellation
  await restoreStockForItems(order.items);

  // Refund if Stripe payment was made
  if (order.paymentMethod === "stripe" && order.isPaid) {
    try {
      await stripe.refunds.create({
        payment_intent: order.paymentResult.id,
      });
      order.orderStatus = "refunded";
      order.statusHistory.push({ status: "refunded", note: "Refund issued via Stripe" });
    } catch (err) {
      throw ApiError.internal("Refund failed: " + err.message);
    }
  } else {
    order.orderStatus = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: req.body.reason || "Cancelled by customer" });
  }

  order.cancelReason = req.body.reason || "Cancelled by customer";
  await order.save();

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

  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();

  await Notification.create({
    user: order.user,
    title: "Order status updated",
    message: `Your order ${order.orderNumber} status is now: ${status}.`,
    type: "order",
    link: `/dashboard/orders/${order._id}`,
  });

  // Non-blocking status update email to customer
  if (status) {
    User.findById(order.user).then((customer) => {
      if (customer) {
        emailService.sendOrderStatusUpdate({
          order,
          user: customer,
          newStatus: status,
          note,
          trackingNumber,
        }).catch((err) =>
          console.error("[EmailService] Order status update email error:", err.message)
        );
      }
    }).catch(() => {});
  }

  return sendSuccess(res, 200, "Order status updated successfully", order);
});

module.exports = {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};

