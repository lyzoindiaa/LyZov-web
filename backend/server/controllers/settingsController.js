const SiteSettings = require("../models/SiteSettings");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");

// @desc    Get site settings (public route for storefront banner)
// @route   GET /api/settings
// @access  Public
const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();
  return sendSuccess(res, 200, "Site settings retrieved", {
    isDevelopmentMode: settings.isDevelopmentMode,
    developmentMessage: settings.developmentMessage,
    updatedAt: settings.updatedAt,
  });
});

// @desc    Update site settings (Development mode toggle & banner message)
// @route   PUT /api/settings
// @access  Private/Admin/Seller
const updateSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSettings();

  const { isDevelopmentMode, developmentMessage } = req.body;

  if (typeof isDevelopmentMode === "boolean") {
    settings.isDevelopmentMode = isDevelopmentMode;
  }

  if (typeof developmentMessage === "string" && developmentMessage.trim()) {
    settings.developmentMessage = developmentMessage.trim();
  }

  settings.updatedBy = req.user._id;
  await settings.save();

  return sendSuccess(res, 200, "Site settings updated successfully", {
    isDevelopmentMode: settings.isDevelopmentMode,
    developmentMessage: settings.developmentMessage,
    updatedAt: settings.updatedAt,
  });
});

module.exports = {
  getSiteSettings,
  updateSiteSettings,
};
