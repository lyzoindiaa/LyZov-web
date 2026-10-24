const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  register,
  login,
  googleLogin,
  googleCallback,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  registerSeller,
  getMe,
  logoutAll,
  getActiveSessions,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validateMiddleware");
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  registerSellerValidator,
} = require("../validators/authValidators");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120, // generous for normal multi-tab app usage
  message: { success: false, message: "Too many refresh attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
});

router.post("/register", authLimiter, registerValidator, validate, register);
router.post("/seller/register", authLimiter, registerSellerValidator, validate, registerSeller);
router.post("/login", authLimiter, loginValidator, validate, login);
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll);
router.get("/sessions", protect, getActiveSessions);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordValidator, validate, resetPassword);
router.get("/me", protect, getMe);

module.exports = router;
