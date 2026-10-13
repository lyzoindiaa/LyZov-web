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

  // Normalize request URL for Express route matching
  const forwardedUri = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
  if (forwardedUri && (req.url === "/api/index.js" || req.url === "/index.js" || req.url === "/api" || req.url === "/api/")) {
    req.url = forwardedUri;
  }

  // Ensure URL retains /api prefix required by Express routes (unless seo routes like sitemap/robots)
  if (
    !req.url.startsWith("/api") &&
    !req.url.startsWith("/sitemap.xml") &&
    !req.url.startsWith("/robots.txt")
  ) {
    req.url = `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }

  return app(req, res);
};
