const express = require("express");
const rateLimit = require("express-rate-limit");
const { submitInquiry } = require("../controllers/supportController");

const router = express.Router();

const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/contact", supportLimiter, submitInquiry);

module.exports = router;
