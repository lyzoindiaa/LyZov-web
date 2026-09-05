const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");

// @desc    Submit customer support inquiry
// @route   POST /api/support/contact
// @access  Public
const submitInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, category, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw ApiError.badRequest("Please provide your name, email, subject, and message");
  }

  // Basic email syntax check
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    throw ApiError.badRequest("Please provide a valid email address");
  }

  const { ticketId } = await emailService.sendSupportInquiry({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : "",
    subject: subject.trim(),
    category: category || "General Inquiry",
    message: message.trim(),
    relatedUser: req.user?._id || null,
  });

  return sendSuccess(res, 200, "Your inquiry has been received. Our team will contact you shortly.", {
    ticketId,
  });
});

module.exports = {
  submitInquiry,
};
