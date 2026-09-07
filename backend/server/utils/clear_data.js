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

    // Keep ONLY seller/admin user
    await User.deleteMany({ role: { $nin: ["seller", "admin"] } });

    let seller = await User.findOne({ email: "lyzovindia@gmail.com" });
    if (!seller) {
      console.log("Creating default seller account...");
      seller = await User.create({
        name: "LyZov Seller",
        email: "lyzovindia@gmail.com",
        password: "Admin@1234",
        role: "seller",
        isEmailVerified: true,
      });
    }

    console.log("Success! All sample data removed. ONLY Seller account remains:");
    console.log("Seller Email:", seller.email);
    process.exit(0);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
};

clearExceptAdmin();