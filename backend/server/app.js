const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const addressRoutes = require("./routes/addressRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalyticsRoute");
const adminRoutes = require("./routes/adminRoutes");
const emailRoutes = require("./routes/emailSenderRoute");
const supportRoutes = require("./routes/supportRoutes");
const sellerEmailRoutes = require("./routes/sellerEmailRoutes");
const customerEmailRoutes = require("./routes/customerEmailRoutes");
const seoRoutes = require("./routes/seoRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const { prerenderRoute } = require("./services/prerenderService");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const clientOrigin = process.env.CLIENT_URL ||
  (process.env.NODE_ENV === "production" ? "https://lyzov.com" : "http://localhost:5173");

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://checkout.razorpay.com",
                "https://accounts.google.com",
              ],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              imgSrc: [
                "'self'",
                "data:",
                "blob:",
                "https://res.cloudinary.com",
                "https://*.razorpay.com",
                "https://lh3.googleusercontent.com",
              ],
              connectSrc: [
                "'self'",
                clientOrigin,
                "https://api.razorpay.com",
                "https://lumberjack.razorpay.com",
                "https://accounts.google.com",
                "https://res.cloudinary.com",
                "https://staging-express.delhivery.com",
                "https://track.delhivery.com",
                "https://*.vercel.app",
              ],
              frameSrc: [
                "'self'",
                "https://api.razorpay.com",
                "https://checkout.razorpay.com",
                "https://accounts.google.com",
              ],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  clientOrigin,
  process.env.CLIENT_URL,
  "https://lyzov.com",
  "https://www.lyzov.com",
  "http://localhost:5173",
  "http://localhost:5000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Razorpay Webhook requires raw bytes to verify HMAC-SHA256 signature
app.use(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString("utf8");
      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        req.body = {};
      }
    }
    next();
  }
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(mongoSanitize());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
});
app.use("/api", globalLimiter);


app.get(["/api", "/api/", "/api/index"], (req, res) => {
  res.status(200).json({ success: true, message: "LyZov Gentlemen API is running", timestamp: new Date() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: `LyZov Gentlemen API is healthy ${process.env.CLIENT_URL || ""}`, timestamp: new Date() });
});


app.use("/api/seller", adminAnalyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/seller/emails", sellerEmailRoutes);
app.use("/api/admin/emails", sellerEmailRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer/emails", customerEmailRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/cron", require("./routes/cronRoutes"));

// ── SEO Endpoints (Sitemap & Robots) ──
app.use("/", seoRoutes);

// ── Serve Frontend ──
const candidateDirs = [
  path.join(__dirname, "../../frontend/client/dist"),
  path.join(process.cwd(), "frontend/client/dist"),
  path.resolve("frontend/client/dist"),
];
const frontendDist = candidateDirs.find((dir) => fs.existsSync(path.join(dir, "index.html"))) || candidateDirs[0];
const indexHtmlPath = path.join(frontendDist, "index.html");

if (fs.existsSync(indexHtmlPath)) {
  app.use(
    express.static(frontendDist, {
      index: false,
      maxAge: "30d",
      setHeaders: (res, staticPath) => {
        if (staticPath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (staticPath.includes(path.sep + "assets" + path.sep) || staticPath.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (/\.(ico|png|jpg|jpeg|webp|avif|svg|gif|woff2?)$/i.test(staticPath)) {
          res.setHeader("Cache-Control", "public, max-age=2592000, stale-while-revalidate=86400");
        }
      },
    })
  );

  app.get("*", async (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Missing static files (hashed JS/CSS etc.) must 404, not return index.html
    if (req.path.startsWith("/assets/") || path.extname(req.path)) {
      return next();
    }

    try {
      const result = await prerenderRoute(req, indexHtmlPath);
      if (result?.redirect) {
        return res.redirect(result.statusCode || 301, result.redirect);
      }
      if (result?.html) {
        res.setHeader(
          "Cache-Control",
          result.notFound
            ? "no-cache, no-store, must-revalidate"
            : "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
        );
        return res.status(result.statusCode || 200).send(result.html);
      }
    } catch (err) {
      console.error("Prerender error for path", req.path, err);
    }

    res.sendFile(indexHtmlPath);
  });
} else {
  // If dist hasn't been built yet
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "LyZov API is running. Frontend dist not found — please run 'npm run build' during deployment.",
    });
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
