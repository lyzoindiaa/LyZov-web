const { cloudinary } = require("../config/cloudinary");

/**
 * Generate a time-limited signed URL for a KYC document stored in Cloudinary.
 * Default expiration is 10 minutes (600 seconds).
 */
const generateSignedKycUrl = (publicId, { expiresInSeconds = 600 } = {}) => {
  if (!publicId) return "";

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // Generate valid signed URL on Cloudinary matching upload storage type and auto format
    return cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      resource_type: "auto",
    });
  } catch (err) {
    console.error("[KYC Document] Failed to generate signed URL:", err.message);
    return "";
  }
};

module.exports = {
  generateSignedKycUrl,
};
