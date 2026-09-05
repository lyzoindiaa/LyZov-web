const crypto = require("crypto");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/generateTokens");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = await User.create({ name, email, password });

  await Cart.create({ user: user._id, items: [] });
  await Wishlist.create({ user: user._id, products: [] });

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

  // Dispatch branded luxury welcome & verification email
  await emailService.sendWelcomeVerification({ user, verifyUrl });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, 201, "Account created successfully", {
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated. Contact support.");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshTokens.push({ token: refreshToken });
  user.lastLoginAt = new Date();

  // keep only last 5 refresh tokens per user
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, 200, "Logged in successfully", {
    user: user.toSafeObject(),
    accessToken,
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires refresh cookie)
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw ApiError.unauthorized("No refresh token provided");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized("User no longer exists");
  }

  const tokenExists = user.refreshTokens.some((rt) => rt.token === token);
  if (!tokenExists) {
    // possible token reuse/theft â€” invalidate all sessions
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });
    throw ApiError.unauthorized("Refresh token invalid. Please log in again.");
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
  user.refreshTokens.push({ token: newRefreshToken });
  await user.save({ validateBeforeSave: false });

  setAuthCookies(res, newAccessToken, newRefreshToken);

  return sendSuccess(res, 200, "Token refreshed", { accessToken: newAccessToken });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token && req.user) {
    req.user.refreshTokens = req.user.refreshTokens.filter((rt) => rt.token !== token);
    await req.user.save({ validateBeforeSave: false });
  }

  clearAuthCookies(res);
  return sendSuccess(res, 200, "Logged out successfully");
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Verification link is invalid or has expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Dispatch confirmation email
  await emailService.sendVerificationSuccess({ user });

  return sendSuccess(res, 200, "Email verified successfully");
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public / Private
const resendVerification = asyncHandler(async (req, res) => {
  const email = req.body.email || req.user?.email;
  if (!email) {
    throw ApiError.badRequest("Email is required to resend verification");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return sendSuccess(res, 200, "If an account with that email exists, a verification link has been sent.");
  }

  if (user.isEmailVerified) {
    return sendSuccess(res, 200, "Your email is already verified.");
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

  await emailService.sendWelcomeVerification({ user, verifyUrl });

  return sendSuccess(res, 200, "Verification email has been sent. Please check your inbox.");
});

// @desc    Forgot password - send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return sendSuccess(res, 200, "If that email exists, a reset link has been sent");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await emailService.sendPasswordReset({ user, resetUrl });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.internal("Failed to send reset email. Try again later.");
  }

  return sendSuccess(res, 200, "If that email exists, a reset link has been sent");
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest("Reset link is invalid or has expired");
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  // Send confirmation notice
  await emailService.sendPasswordResetSuccess({ user });

  return sendSuccess(res, 200, "Password reset successful. Please log in.");
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Current user fetched", { user: req.user.toSafeObject() });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
};
