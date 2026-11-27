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

  // Rebuild the real URL so Express can accurately route sub-paths (e.g. /api/auth/google, /api/categories, /api/products).
  try {
    const parsed = new URL(req.url, "http://localhost");
    const pParam = parsed.searchParams.get("__p");
    const originalUri = req.headers["x-vercel-original-path"] || req.headers["x-forwarded-uri"];

    // 1. Explicit clean path passed via __p query param (e.g. sitemap, robots, prerender)
    if (pParam && pParam.startsWith("/") && !pParam.includes("$") && !pParam.includes(":path")) {
      parsed.searchParams.delete("__p");
      const qs = parsed.searchParams.toString();
      req.url = pParam + (qs ? `?${qs}` : "");
    }
    // 2. Vercel original request path header
    else if (originalUri && String(originalUri).startsWith("/") && !originalUri.includes("/api/index")) {
      req.url = originalUri;
    }
    // 3. Vercel named wildcard params in query (source: /api/:path*)
    else if (req.query?.path || req.query?.["path*"]) {
      const sub = Array.isArray(req.query.path || req.query["path*"])
        ? (req.query.path || req.query["path*"]).join("/")
        : String(req.query.path || req.query["path*"]);
      parsed.searchParams.delete("path");
      parsed.searchParams.delete("path*");
      parsed.searchParams.delete("__p");
      const qs = parsed.searchParams.toString();
      req.url = "/api/" + sub.replace(/^\/+/, "") + (qs ? `?${qs}` : "");
    }
    // 4. Vercel regex rewrite matches header
    else if (req.headers["x-now-route-matches"]) {
      const params = new URLSearchParams(req.headers["x-now-route-matches"]);
      const m = params.get("1") || params.get("match") || params.get("path");
      if (m) {
        req.url = "/api/" + decodeURIComponent(m).replace(/^\/+/, "");
      }
    }
    // 5. Fallback for /api/index root call -> /api
    else if (req.url === "/api/index" || req.url === "/api/index/") {
      req.url = "/api";
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
