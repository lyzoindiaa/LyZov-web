const EmailLog = require("../models/EmailLog");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get the authenticated customer's email history
// @route   GET /api/customer/emails
// @access  Private (Customer)
const getMyEmailLogs = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
  const query = { relatedUser: req.user._id, "metadata.customerVisible": true };

  const [logs, total] = await Promise.all([
    EmailLog.find(query)
      .select("recipient recipientName template subject bodyText status relatedOrder sentAt createdAt")
      .populate("relatedOrder", "orderNumber")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    EmailLog.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Your email history was retrieved successfully", logs, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

module.exports = { getMyEmailLogs };