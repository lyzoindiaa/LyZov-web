/**
 * Script to seed or promote a Super Admin in MongoDB.
 *
 * Usage:
 *   node backend/server/scripts/seed-admin.js [email] [password] [name]
 *
 * Defaults:
 *   email:    admin@lyzov.com
 *   password: Admin@LyZov2026!
 *   name:     LyZov Super Admin
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const targetEmail = (args[0] || "admin@lyzov.com").toLowerCase().trim();
  const targetPassword = args[1] || "Admin@LyZov2026!";
  const targetName = args[2] || "LyZov Super Admin";

  console.log("Connecting to MongoDB via connectDB()...");
  await connectDB(2, 3000);


  try {
    let user = await User.findOne({ email: targetEmail }).select("+password");

    if (user) {
      console.log(`\nFound existing user with email: ${targetEmail}`);
      user.name = targetName || user.name;
      user.role = "admin";
      user.isActive = true;
      user.isEmailVerified = true;
      user.password = targetPassword; // Pre-save hook will hash this

      await user.save();
      console.log(`✅ Successfully promoted user to Super Admin and updated credentials!`);
    } else {
      console.log(`\nUser with email ${targetEmail} not found. Creating brand new Super Admin...`);

      user = new User({
        name: targetName,
        email: targetEmail,
        password: targetPassword,
        role: "admin",
        isActive: true,
        isEmailVerified: true,
        profileComplete: true,
      });

      await user.save();

      // Create initial Cart & Wishlist
      await Promise.all([
        Cart.create({ user: user._id, items: [] }),
        Wishlist.create({ user: user._id, products: [] }),
      ]);

      console.log(`✅ Successfully created brand new Super Admin user!`);
    }

    console.log(`\n========================================`);
    console.log(`👑 LYZOV SUPER ADMIN CREDENTIALS`);
    console.log(`========================================`);
    console.log(`Email:    ${targetEmail}`);
    console.log(`Password: ${targetPassword}`);
    console.log(`Role:     admin`);
    console.log(`Status:   Active & Verified`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedAdmin();
