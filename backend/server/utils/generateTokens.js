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

const setAuthCookies = (res, accessToken, refreshToken) => {
  const isCrossOrigin = process.env.NODE_ENV === "production" ||
    Boolean(process.env.CLIENT_URL && process.env.CLIENT_URL !== "http://localhost:5173");
  const isSecure = process.env.NODE_ENV === "production" || isCrossOrigin;
  const sameSite = isSecure ? "none" : "lax";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 7*24*60 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth/refresh",
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
