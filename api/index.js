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

  // vercel.json rewrites /api/* to this function as /api/index?__p=/api/$1.
  // Rebuild the real URL so Express can accurately route sub-paths (e.g. /api/auth/google, /api/categories, /api/products).
  try {
    const parsed = new URL(req.url, "http://localhost");
    const pParam = parsed.searchParams.get("__p");
    const originalUri = req.headers["x-forwarded-uri"] || req.headers["x-vercel-original-path"];

    if (pParam && pParam.startsWith("/") && !pParam.includes("$")) {
      parsed.searchParams.delete("__p");
      const qs = parsed.searchParams.toString();
      req.url = pParam + (qs ? `?${qs}` : "");
    } else if (originalUri && String(originalUri).startsWith("/") && !originalUri.includes("/api/index")) {
      req.url = originalUri;
    }
  } catch (error) {
    console.error("Failed to restore original request URL:", error);
  }

  req.originalUrl = req.url;

  if (req.query) {
    delete req.query.__p;
    delete req.query.path;
    delete req.query["path*"];
    delete req.query.slug;
    delete req.query["slug*"];
  }

  return app(req, res);
};
