/**
 * Utility functions for automatic image optimization.
 * Automatically injects Cloudinary transformations (f_auto, q_auto, responsive widths)
 * to deliver modern WebP/AVIF formats and cut download sizes by up to 90%.
 */

export const optimizeCloudinaryUrl = (url, { width = 600, quality = "auto" } = {}) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;

  // Avoid duplicate transformation injection
  if (url.includes("/upload/f_auto") || url.includes("/upload/q_auto")) return url;

  const transform = `f_auto,q_${quality},w_${width},c_limit`;
  return url.replace("/upload/", `/upload/${transform}/`);
};

export const getCloudinarySrcSet = (url) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return undefined;
  }
  const widths = [320, 600, 900];
  return widths
    .map((w) => `${optimizeCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(", ");
};
