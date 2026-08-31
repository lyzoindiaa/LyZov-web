const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalRevenueAgg = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);

  const revenueByDay = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 14 }
  ]);

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
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
// @access  Private/Admin
exports.getRevenueByDay = asyncHandler(async (req, res) => {
  const revenueByDay = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  return sendSuccess(res, 200, "Revenue data fetched successfully", revenueByDay);
});

// @desc    Get orders by status
// @route   GET /api/admin/orders-by-status
// @access  Private/Admin
exports.getOrdersByStatus = asyncHandler(async (req, res) => {
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
  ]);
  return sendSuccess(res, 200, "Orders by status fetched successfully", ordersByStatus);
});

// @desc    Get recent orders
// @route   GET /api/admin/recent-orders
// @access  Private/Admin
exports.getRecentOrders = asyncHandler(async (req, res) => {
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "name email");
  return sendSuccess(res, 200, "Recent orders fetched successfully", recentOrders);
});
