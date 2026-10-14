const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d",
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const getCookieOptions = (isRefresh = false) => {
  const isCrossOrigin =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.CLIENT_URL && process.env.CLIENT_URL !== "http://localhost:5173");
  const isSecure = process.env.NODE_ENV === "production" || isCrossOrigin;
  const sameSite = isSecure ? "none" : "lax";

  const options = {
    httpOnly: true,
    secure: isSecure,
    sameSite,
  };

  if (isRefresh) {
    options.path = "/api/auth";
    options.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  } else {
    options.path = "/";
    options.maxAge = 15 * 60 * 1000; // 15 mins
  }

  return options;
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  if (accessToken) {
    res.cookie("accessToken", accessToken, getCookieOptions(false));
  }
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, getCookieOptions(true));
  }
};

const clearAuthCookies = (res) => {
  const accessOpts = getCookieOptions(false);
  delete accessOpts.maxAge;
  res.clearCookie("accessToken", accessOpts);

  const refreshOpts = getCookieOptions(true);
  delete refreshOpts.maxAge;
  res.clearCookie("refreshToken", refreshOpts);

  // Clean up legacy refresh cookie path if present
  res.clearCookie("refreshToken", { ...refreshOpts, path: "/api/auth/refresh" });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
