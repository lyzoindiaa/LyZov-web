const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./app");
const connectDB = require("./config/db");

// Render provides PORT at runtime; local development falls back to 5000.
const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  // [SINGLE-SELLER MODE] Payout settlement cron disabled. Uncomment to re-enable multi-vendor payouts.
  // const { startSettlementScheduler } = require("./jobs/settlementCron");
  // startSettlementScheduler();

  const server = app.listen(PORT, () => {
    console.log(`LyZov API running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! Shutting down...");
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received. Shutting down gracefully...");
    server.close(() => {
      console.log("Process terminated");
    });
  });
};

startServer();
