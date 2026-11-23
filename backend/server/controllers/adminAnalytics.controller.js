const mongoose = require("mongoose");
const Order = require("../models/Order");
const SubOrder = require("../models/SubOrder");
const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get dashboard statistics (tenant-aware for sellers & global for admin)
// @route   GET /api/admin/stats
// @access  Private/Admin/Seller
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === "seller";
  const sellerId = req.user._id;

  if (isSeller) {
    // ── Seller-Scoped Tenant Analytics ──
    const sellerFilter = {
      seller: new mongoose.Types.ObjectId(sellerId),
      orderStatus: { $nin: ["cancelled", "refunded"] },
    };

    const [totalRevenueAgg, revenueByDay, ordersByStatus, totalOrders, totalProducts, distinctCustomers, recentSubOrders] =
      await Promise.all([
        SubOrder.aggregate([
          { $match: sellerFilter },
          // [SINGLE-SELLER MODE] 100% revenue goes to the seller (no commission/tax deduction).
          // { $group: { _id: null, total: { $sum: "$sellerEarnings" } } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
        SubOrder.aggregate([
          { $match: sellerFilter },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              // revenue: { $sum: "$sellerEarnings" },
              revenue: { $sum: "$totalPrice" },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 14 },
        ]),
        SubOrder.aggregate([
          { $match: { seller: new mongoose.Types.ObjectId(sellerId) } },
          { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        ]),
        SubOrder.countDocuments({ seller: sellerId }),
        Product.countDocuments({ seller: sellerId }),
        SubOrder.distinct("customer", { seller: sellerId }),
        SubOrder.find({ seller: sellerId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("customer", "name email")
          .lean(),
      ]);

    // Format recent orders so seller frontend renders smoothly
    const formattedRecentOrders = recentSubOrders.map((so) => ({
      ...so,
      orderNumber: so.subOrderNumber,
      user: so.customer,
      totalPrice: so.totalPrice,
    }));

    return sendSuccess(res, 200, "Seller dashboard stats fetched successfully", {
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      totalOrders,
      totalProducts,
      totalUsers: distinctCustomers.length,
      revenueByDay,
      ordersByStatus,
      recentOrders: formattedRecentOrders,
    });
  }

  // ── SuperAdmin Global Marketplace Analytics ──
  const totalRevenueAgg = await Order.aggregate([
    { $match: { orderStatus: { $nin: ["cancelled", "refunded"] } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);

  const revenueByDay = await Order.aggregate([
    { $match: { orderStatus: { $nin: ["cancelled", "refunded"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 14 },
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name email");

  return sendSuccess(res, 200, "Dashboard stats fetched successfully", {
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    totalOrders: await Order.countDocuments(),
    totalProducts: await Product.countDocuments(),
    totalUsers: await User.countDocuments(),
    revenueByDay,
    ordersByStatus,
    recentOrders,
  });
});

// @desc    Get revenue by day
// @route   GET /api/admin/revenue-by-day
// @access  Private/Admin/Seller
exports.getRevenueByDay = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === "seller";
  const matchFilter = isSeller
    ? {
        seller: new mongoose.Types.ObjectId(req.user._id),
        orderStatus: { $nin: ["cancelled", "refunded"] },
      }
    : { orderStatus: { $nin: ["cancelled", "refunded"] } };

  const Model = isSeller ? SubOrder : Order;
  // [SINGLE-SELLER MODE] 100% revenue belongs to the seller (no commission/tax deduction).
  // const sumField = isSeller ? "$sellerEarnings" : "$totalPrice";
  const sumField = "$totalPrice";

  const revenueByDay = await Model.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: sumField },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return sendSuccess(res, 200, "Revenue data fetched successfully", revenueByDay);
});

// @desc    Get orders by status
// @route   GET /api/admin/orders-by-status
// @access  Private/Admin/Seller
exports.getOrdersByStatus = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === "seller";
  const matchFilter = isSeller
    ? { seller: new mongoose.Types.ObjectId(req.user._id) }
    : {};

  const Model = isSeller ? SubOrder : Order;

  const ordersByStatus = await Model.aggregate([
    ...(isSeller ? [{ $match: matchFilter }] : []),
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);
  return sendSuccess(res, 200, "Orders by status fetched successfully", ordersByStatus);
});

// @desc    Get recent orders
// @route   GET /api/admin/recent-orders
// @access  Private/Admin/Seller
exports.getRecentOrders = asyncHandler(async (req, res) => {
  const isSeller = req.user.role === "seller";

  if (isSeller) {
    const recentSubOrders = await SubOrder.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "name email")
      .lean();

    const formatted = recentSubOrders.map((so) => ({
      ...so,
      orderNumber: so.subOrderNumber,
      user: so.customer,
      totalPrice: so.totalPrice,
    }));
    return sendSuccess(res, 200, "Recent seller orders fetched successfully", formatted);
  }

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name email");
  return sendSuccess(res, 200, "Recent orders fetched successfully", recentOrders);
});
