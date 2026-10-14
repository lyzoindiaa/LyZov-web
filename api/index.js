const path = require("path");
const dotenv = require("dotenv");

// Load .env if present (Vercel provides process.env automatically)
dotenv.config();

const app = require("../backend/server/app");
const connectDB = require("../backend/server/config/db");

let isConnecting = false;

module.exports = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1 && !isConnecting) {
      isConnecting = true;
      await connectDB();
      isConnecting = false;
    }
  } catch (error) {
    console.error("MongoDB serverless connection error:", error);
  }

  // vercel.json rewrites /api/* to this function as /api/index?__p=<original path>.
  // Rebuild the real URL (path + original query string) so Express can route it.
  try {
    const parsed = new URL(req.url, "http://localhost");
    const originalPath = parsed.searchParams.get("__p");
    if (originalPath && originalPath.startsWith("/api")) {
      parsed.searchParams.delete("__p");
      const qs = parsed.searchParams.toString();
      req.url = originalPath + (qs ? `?${qs}` : "");
    } else {
      const originalUri = req.headers["x-forwarded-uri"] || req.headers["x-vercel-original-path"];
      if (originalUri && String(originalUri).startsWith("/api")) {
        req.url = originalUri;
      }
    }
  } catch (error) {
    console.error("Failed to restore original request URL:", error);
  }

  if (req.query && req.query.__p) {
    delete req.query.__p;
  }

  return app(req, res);
};
