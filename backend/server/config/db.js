const mongoose = require("mongoose");

const connectDB = async (retries = 5, delay = 5000) => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured in the backend environment");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        autoIndex: process.env.NODE_ENV !== "production",
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);

      mongoose.connection.on("error", (err) => {
        console.error(`MongoDB connection error: ${err.message}`);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected. Mongoose will attempt to reconnect...");
      });

      return conn;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} of ${retries} failed: ${error.message}`);
      if (/whitelist|ip access list|not authorized/i.test(error.message)) {
        console.error(
          "Add your IP/server to MongoDB Atlas > Network Access > IP Access List (e.g., 0.0.0.0/0 for cloud deployments)."
        );
      }
      if (attempt === retries) {
        console.error("All MongoDB connection attempts exhausted. Exiting process.");
        process.exit(1);
      }
      console.log(`Retrying MongoDB connection in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;
