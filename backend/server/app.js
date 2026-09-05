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
const emailRoutes = require("./routes/emailSenderRoute");
const supportRoutes = require("./routes/supportRoutes");
const sellerEmailRoutes = require("./routes/sellerEmailRoutes");
const customerEmailRoutes = require("./routes/customerEmailRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(mongoSanitize());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development", // disable in dev
});
app.use("/api", globalLimiter);


app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: `LyZov Gentlemen API is healthy ${process.env.CLIENT_URL || ""}`, timestamp: new Date() });
});


app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/seller", adminAnalyticsRoutes);
app.use("/api/auth", authRoutes);
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
app.use("/api/customer/emails", customerEmailRoutes);

// ── Serve Frontend ──
const frontendDist = path.join(__dirname, "../../frontend/client/dist");
const indexHtmlPath = path.join(frontendDist, "index.html");

if (fs.existsSync(indexHtmlPath)) {
  app.use(express.static(frontendDist));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
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
