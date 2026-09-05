const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const sendEmail = require("../utils/sendEmail");
const { protect, authorize } = require("../middleware/authMiddleware");

// POST /api/email/send - Protected for seller/admin
router.post(
  "/send",
  protect,
  authorize("seller", "admin"),
  asyncHandler(async (req, res) => {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      throw ApiError.badRequest("Recipient (to), subject, and content (html/text) are required");
    }

    const result = await sendEmail({ to, subject, html, text });

    res.status(200).json({ success: true, message: "Email dispatched successfully", result });
  })
);

module.exports = router;
