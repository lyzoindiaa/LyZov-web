const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

/**
 * @desc    Middleware to check if user has completed their profile (phone + address)
 * @route   Applied to checkout and order creation endpoints
 * @access  Protected routes only
 */
const requireProfileComplete = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized("User not authenticated");
  }

  if (!req.user.profileComplete) {
    throw ApiError.forbidden(
      "Please complete your profile (phone & address) before placing orders. Redirecting to profile completion..."
    );
  }

  next();
});

module.exports = {
  requireProfileComplete,
};
