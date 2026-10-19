const path = require("path");
const dotenv = require("dotenv");

// Load .env if present (Vercel provides process.env automatically)
dotenv.config();

const app = require("../backend/server/app");
const connectDB = require("../backend/server/config/db");

let cachedConn = null;

const ensureDbConnected = async () => {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!cachedConn) {
    cachedConn = connectDB().catch((err) => {
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

  // vercel.json rewrites /api/* to this function as /api/index?__p=<original path>.
  // Rebuild the real URL (path + original query string) so Express can route it.
  try {
    const parsed = new URL(req.url, "http://localhost");
    const originalPath = parsed.searchParams.get("__p");
    if (originalPath && originalPath.startsWith("/")) {
      parsed.searchParams.delete("__p");
      const qs = parsed.searchParams.toString();
      req.url = originalPath + (qs ? `?${qs}` : "");
    } else {
      const originalUri = req.headers["x-forwarded-uri"] || req.headers["x-vercel-original-path"];
      if (originalUri && String(originalUri).startsWith("/")) {
        req.url = originalUri;
      }
    }
  } catch (error) {
    console.error("Failed to restore original request URL:", error);
  }

  req.originalUrl = req.url;

  if (req.query) {
    delete req.query.__p;
    delete req.query.path;
    delete req.query["path*"];
  }

  return app(req, res);
};
