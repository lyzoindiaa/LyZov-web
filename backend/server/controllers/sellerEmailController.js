const EmailLog = require("../models/EmailLog");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");

// @desc    Get email delivery logs (seller/admin)
// @route   GET /api/seller/emails
// @access  Private (Seller/Admin)
const getEmailLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;
  const { status, template, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (template) query.template = template;
  if (search) {
    query.$or = [
      { recipient: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { recipientName: { $regex: search, $options: "i" } },
    ];
  }

  const logs = await EmailLog.find(query)
    .sort("-createdAt")
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await EmailLog.countDocuments(query);
  const connectionHealth = await emailService.verifyConnection();

  return sendSuccess(res, 200, "Email logs retrieved successfully", logs, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    smtpStatus: connectionHealth,
    configured: emailService.isConfigured(),
  });
});

// @desc    Trigger test email to verify SMTP configuration
// @route   POST /api/seller/emails/test
// @access  Private (Seller/Admin)
const sendTestEmail = asyncHandler(async (req, res) => {
  const targetEmail = req.body.email || req.user.email;
  if (!targetEmail) {
    throw ApiError.badRequest("Recipient email is required for test dispatch");
  }

  const result = await emailService.sendTestEmail({
    to: targetEmail,
    sellerName: req.user.name,
  });

  return sendSuccess(res, 200, "Test email processed", result);
});

module.exports = {
  getEmailLogs,
  sendTestEmail,
};
