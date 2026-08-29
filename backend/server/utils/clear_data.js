const path = require('path'); 
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Category = require("../models/Category");
const Brand = require("../models/Brand");
const Product = require("../models/Product");

const clearExceptAdmin = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    console.log("Deleting all products, categories, brands, orders, reviews...");
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      mongoose.connection.db.collection("orders").deleteMany({}),
      mongoose.connection.db.collection("carts").deleteMany({}),
      mongoose.connection.db.collection("reviews").deleteMany({}),
      mongoose.connection.db.collection("coupons").deleteMany({}),
    ]);

    // Keep ONLY admin user
    await User.deleteMany({ role: { $ne: "admin" } });

    let admin = await User.findOne({ email: "admin@lyzov.com" });
    if (!admin) {
      console.log("Creating default admin account...");
      admin = await User.create({
        name: "LyZov Admin",
        email: "admin@lyzov.com",
        password: "Admin@1234",
        role: "admin",
        isEmailVerified: true,
      });
    }

    console.log("Success! All sample data removed. ONLY Admin account remains:");
    console.log("Admin Email:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
};

clearExceptAdmin();