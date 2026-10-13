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

  // Restore original request URL if rewritten by Vercel
  const originalUri = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
  if (originalUri) {
    req.url = originalUri;
  }

  return app(req, res);
};
