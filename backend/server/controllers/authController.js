const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const emailService = require("../services/emailService");
const { OAuth2Client } = require("google-auth-library");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/generateTokens");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleRedirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ||
  `${process.env.NODE_ENV === "production" ? "https://lyzov.com" : process.env.API_URL || "http://localhost:5000"}/api/auth/google/callback`;

const getFrontendUrl = () =>
  process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production" ? "https://lyzov.com" : "http://localhost:5173");

const createGoogleOAuthState = () => {
  const payload = Buffer.from(JSON.stringify({
    nonce: crypto.randomBytes(24).toString("hex"),
    createdAt: Date.now(),
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

const isValidGoogleOAuthState = (state) => {
  try {
    const [payload, signature] = state.split(".");
    if (!payload || !signature) return false;

    const expectedSignature = crypto.createHmac("sha256", process.env.COOKIE_SECRET).update(payload).digest("base64url");
    const signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    if (!signaturesMatch) return false;

    const { createdAt } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Date.now() - createdAt <= 10 * 60 * 1000;
  } catch {
    return false;
  }
};

const createSession = async (res, user, req) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const { rawToken } = await Session.createSession({ user, req });

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookies(res, accessToken, rawToken);

  return { accessToken, rawToken };
};

// @desc    Start Google OAuth authorization-code flow
// @route   GET /api/auth/google
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw ApiError.internal("Google authentication is not configured");
  }

  const state = createGoogleOAuthState();

  const authorizationUrl = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
    redirect_uri: getGoogleRedirectUri(),
  });

  return res.redirect(authorizationUrl);
});

// @desc    Complete Google OAuth authorization-code flow
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  const redirectToLogin = (error) => {
    const url = new URL(`${getFrontendUrl()}/login`);
    if (error) url.searchParams.set("google_error", error);
    return res.redirect(url.toString());
  };

  try {
    if (req.query.error) return redirectToLogin("consent_denied");
    if (!req.query.code || !req.query.state || !isValidGoogleOAuthState(req.query.state)) {
      return redirectToLogin("invalid_oauth_state");
    }

    const { tokens } = await googleClient.getToken({
      code: req.query.code,
      redirect_uri: getGoogleRedirectUri(),
    });
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return redirectToLogin("unverified_google_account");
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }],
    }).select("+password");

    if (user) {
      if (user.isDeleted) return redirectToLogin("account_terminated");
      if (user.googleId && user.googleId !== payload.sub) return redirectToLogin("account_conflict");
      user.googleId = payload.sub;
      user.authProvider = "google";
      user.isEmailVerified = true;
      if (payload.picture && !user.avatar?.url) user.avatar = { url: payload.picture, publicId: "" };
    } else {
      // Generate a readable temporary password for email-login fallback
      // Format: Lyzov@<6 uppercase alphanumeric chars> e.g. "Lyzov@A3K9BF"
      const tempPasswordPlain = `Lyzov@${crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;

      user = new User({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email.toLowerCase(),
        password: tempPasswordPlain, // pre-save hook will bcrypt this
        authProvider: "google",
        googleId: payload.sub,
        isEmailVerified: true,
        profileComplete: false,
        avatar: { url: payload.picture || "", publicId: "" },
      });
      await user.save();
      await Cart.create({ user: user._id, items: [] });
      await Wishlist.create({ user: user._id, products: [] });

      // Send the welcome email with the temporary password (non-blocking)
      const clientUrl = getFrontendUrl();
      const changePasswordUrl = `${clientUrl}/dashboard/profile`;
      const loginUrl = `${clientUrl}/login`;
      emailService
        .sendGoogleWelcomeWithTempPassword({
          user,
          tempPassword: tempPasswordPlain,
          changePasswordUrl,
          loginUrl,
        })
        .catch((err) =>
          console.error("[Auth] Failed to send Google welcome email:", err.message)
        );
    }

    if (!user.isActive) return redirectToLogin("account_deactivated");
    await createSession(res, user, req);
    
    // Redirect based on user role
    let redirectPath = "/dashboard";
    if (user.role === "admin") {
      redirectPath = "/admin";
    } else if (user.role === "seller") {
      redirectPath = "/seller";
    } else if (!user.profileComplete) {
      redirectPath = "/complete-profile";
    }
    return res.redirect(`${getFrontendUrl()}${redirectPath}`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error.message);
    return redirectToLogin("google_auth_failed");
  }
};

// @desc    Register a new user (name + email only, quick signup)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const normalizedEmail = email?.toLowerCase()?.trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    if (existingUser.isDeleted) {
      throw ApiError.forbidden(
        "This email account has been terminated by administration and cannot be re-registered."
      );
    }
    throw ApiError.conflict("An account with this email already exists");
  }

  // Create user with random password (like Google signup)
  // User will set password later in profile settings if desired
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: crypto.randomBytes(32).toString("hex"),
    authProvider: "local",
    profileComplete: false,
    isEmailVerified: false,
  });

  await Cart.create({ user: user._id, items: [] });
  await Wishlist.create({ user: user._id, products: [] });

  // Send welcome email
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;

  await emailService.sendWelcomeVerification({ user, verifyUrl });

  // Create session
  const { accessToken } = await createSession(res, user, req);

  // Return user info + signal frontend to redirect to complete-profile
  return sendSuccess(res, 201, "Account created successfully", {
    user: user.toSafeObject(),
    accessToken,
    profileComplete: false,
    redirectTo: "/complete-profile",
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

  if (user.isDeleted) {
    throw ApiError.forbidden("This account has been terminated by administration.");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated. Contact support.");
  }

  const { accessToken } = await createSession(res, user, req);

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

  const rotated = await Session.rotateSession({ rawToken: token, req });
  if (!rotated) {
    clearAuthCookies(res);
    throw ApiError.unauthorized("Session expired or invalid. Please log in again.");
  }

  const { user, newRawToken, isGraceHit } = rotated;
  const accessToken = generateAccessToken(user._id, user.role);

  if (!isGraceHit && newRawToken) {
    setAuthCookies(res, accessToken, newRawToken);
  } else {
    setAuthCookies(res, accessToken, null);
  }

  return sendSuccess(res, 200, "Token refreshed", { accessToken });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public (clears cookies and revokes session)
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await Session.revokeSession(token);
  }

  clearAuthCookies(res);
  return sendSuccess(res, 200, "Logged out successfully");
});

// @desc    Logout all sessions for current user
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  await Session.revokeAllUserSessions(req.user._id);
  clearAuthCookies(res);
  return sendSuccess(res, 200, "Logged out from all devices successfully");
});

// @desc    Get active sessions for current user
// @route   GET /api/auth/sessions
// @access  Private
const getActiveSessions = asyncHandler(async (req, res) => {
  const currentToken = req.cookies?.refreshToken;
  const currentHash = currentToken ? Session.hashToken(currentToken) : null;

  const sessions = await Session.find({
    user: req.user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort("-lastUsedAt");

  const sessionList = sessions.map((s) => ({
    id: s._id,
    userAgent: s.userAgent || "Unknown Device",
    ip: s.ip ? s.ip.replace(/:\d+$/, "") : "Unknown IP",
    createdAt: s.createdAt,
    lastUsedAt: s.lastUsedAt,
    isCurrent: currentHash ? s.tokenHash === currentHash || s.prevTokenHash === currentHash : false,
  }));

  return sendSuccess(res, 200, "Active sessions fetched", sessionList);
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
  const email = (req.body.email || req.user?.email)?.toLowerCase()?.trim();
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
  const user = await User.findOne({ email: email?.toLowerCase()?.trim() });

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
  await Session.revokeAllUserSessions(user._id);
  clearAuthCookies(res);

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

// @desc    Register a new seller account directly
// @route   POST /api/auth/seller/register
// @access  Public
const registerSeller = asyncHandler(async (req, res) => {
  const { name, email, password, phone, businessName, storeBio } = req.body;
  const normalizedEmail = email?.toLowerCase()?.trim();

  if (!name || !name.trim()) throw ApiError.badRequest("Name is required");
  if (!normalizedEmail) throw ApiError.badRequest("Email is required");
  if (!password || password.length < 8) {
    throw ApiError.badRequest("Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : "",
    role: "seller",
    authProvider: "local",
    profileComplete: false,
    isEmailVerified: false,
    sellerProfile: {
      businessName: businessName ? businessName.trim() : name.trim(),
      storeBio: storeBio ? storeBio.trim() : "",
      kycStatus: "pending",
      onboardingSource: "self",
    },
  });

  await Cart.create({ user: user._id, items: [] });
  await Wishlist.create({ user: user._id, products: [] });

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
  await emailService.sendWelcomeVerification({ user, verifyUrl });

  const { accessToken } = await createSession(res, user, req);

  return sendSuccess(res, 201, "Seller account registered successfully", {
    user: user.toSafeObject(),
    accessToken,
    redirectTo: "/seller/profile",
  });
});

module.exports = {
  register,
  registerSeller,
  login,
  googleLogin,
  googleCallback,
  refresh,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  logoutAll,
  getActiveSessions,
};
