const { cloudinary } = require("../config/cloudinary");

/**
 * Generate a time-limited signed URL for a KYC document stored in Cloudinary.
 * Default expiration is 10 minutes (600 seconds).
 */
const generateSignedKycUrl = (publicId, { expiresInSeconds = 600 } = {}) => {
  if (!publicId) return "";

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    // Cloudinary signed URL generation
    return cloudinary.utils.private_download_url(publicId, "jpg", {
      expires_at: expiresAt,
      resource_type: "image",
      type: "authenticated",
    });
  } catch (err) {
    // Fallback: standard signed URL
    return cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    });
  }
};

module.exports = {
  generateSignedKycUrl,
};
