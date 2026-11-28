const path = require("path");

// Load .env if present (Vercel provides process.env automatically)
try {
  require("dotenv").config();
} catch {}

const app = require("../backend/server/app");
const connectDB = require("../backend/server/config/db");

let cachedConn = null;

const ensureDbConnected = async () => {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!cachedConn) {
    cachedConn = connectDB(1, 0, 4000).catch((err) => {
      cachedConn = null;
      throw err;
    });
  }
  return cachedConn;
};

module.exports = async (req, res) => {
  try {
    await ensureDbConnected();
  } catch (error) {
    console.error("MongoDB serverless connection error:", error);
  }

  // Rebuild the real URL so Express can route it (e.g. /api/auth/google, /api/categories, /shop, /sitemap.xml).
  try {
    req.url = resolveOriginalUrl(req.url, req.headers || {});
  } catch (error) {
    console.error("Failed to restore original request URL:", error);
  }

  req.originalUrl = req.url;

  return app(req, res);
};

// vercel.json rewrites everything to /api/index?__p=<original path>.
// Vercel may also append wildcard params (e.g. ?path=...). A __p pointing back at the
// function itself (/api/index) is never a real route, so it is ignored.
function resolveOriginalUrl(rawUrl, headers) {
  const parsed = new URL(rawUrl, "http://localhost");
  const isSelf = (p) => /^\/api\/index\/?$/.test(p);
  const isValid = (p) => typeof p === "string" && p.startsWith("/") && !p.includes("$") && !p.includes(":path") && !isSelf(p);

  const pParam = parsed.searchParams.get("__p");
  const pathParam = parsed.searchParams.get("path");
  parsed.searchParams.delete("__p");

  let target = null;
  if (isValid(pParam)) {
    target = pParam;
  } else if (pathParam && pathParam !== "index") {
    parsed.searchParams.delete("path");
    target = "/api/" + decodeURIComponent(pathParam).replace(/^\/+/, "");
  } else {
    const originalUri = headers["x-vercel-original-path"] || headers["x-forwarded-uri"];
    if (isValid(originalUri)) return originalUri;
    if (isSelf(parsed.pathname)) {
      if (pathParam === "index") parsed.searchParams.delete("path");
      target = "/api";
    }
  }

  if (!target) return rawUrl;
  const qs = parsed.searchParams.toString();
  return target + (qs ? `?${qs}` : "");
}

module.exports.resolveOriginalUrl = resolveOriginalUrl;
