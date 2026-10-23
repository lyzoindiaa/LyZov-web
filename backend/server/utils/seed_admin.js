// Seed script to provision marketplace accounts and configure admin credentials.
// Supports custom CLI overrides: node utils/seed_admin.js --email <email> --password <password>
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdminAndTestUsers = async () => {
  try {
    const isLocal = process.argv.includes("--local") || process.env.LOCAL_MONGO === "true";
    if (isLocal) {
      console.log("Connecting to local MongoDB (mongodb://127.0.0.1:27017/TblLyZov)...");
      await mongoose.connect("mongodb://127.0.0.1:27017/TblLyZov", { serverSelectionTimeoutMS: 5000 });
      console.log("Local MongoDB connected!");
    } else {
      console.log("Connecting to configured database in .env...");
      await connectDB();
    }

    console.log("Seeding test users for complete marketplace workflow...\n");

    // 1. Super Admin Account (supports CLI flags --email, --password and .env overrides)
    const emailArgIndex = process.argv.findIndex((arg) => arg === "--email" || arg.startsWith("--email="));
    let cliEmail = "";
    if (emailArgIndex !== -1) {
      cliEmail = process.argv[emailArgIndex].includes("=")
        ? process.argv[emailArgIndex].split("=")[1]
        : process.argv[emailArgIndex + 1];
    }

    const passArgIndex = process.argv.findIndex((arg) => arg === "--password" || arg.startsWith("--password="));
    let cliPassword = "";
    if (passArgIndex !== -1) {
      cliPassword = process.argv[passArgIndex].includes("=")
        ? process.argv[passArgIndex].split("=")[1]
        : process.argv[passArgIndex + 1];
    }

    const adminEmail = (cliEmail || process.env.ADMIN_SEED_EMAIL || "admin@lyzov.com").toLowerCase().trim();
    const adminPassword = cliPassword || process.env.ADMIN_SEED_PASSWORD || "Admin@1234";

    let admin = await User.findOne({ email: adminEmail }).select("+password");
    if (!admin) {
      admin = await User.create({
        name: "LyZov Super Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isEmailVerified: true,
      });
      console.log(`[Created] SuperAdmin account: ${adminEmail}`);
    } else {
      admin.role = "admin";
      admin.password = adminPassword; // Will be hashed via pre-save hook
      admin.isEmailVerified = true;
      await admin.save();
      console.log(`[Updated] SuperAdmin account role & password: ${adminEmail}`);
    }

    // 2. Verified Test Seller Account
    const sellerEmail = "seller@lyzov.com";
    const sellerPassword = "Seller@1234";

    let seller = await User.findOne({ email: sellerEmail }).select("+password");
    if (!seller) {
      seller = await User.create({
        name: "Vikram Mehta",
        email: sellerEmail,
        password: sellerPassword,
        role: "seller",
        isEmailVerified: true,
        phone: "+91 9876543210",
        sellerProfile: {
          businessName: "Jaipur Craft Atelier",
          storeSlug: "jaipur-craft-atelier",
          businessType: "Proprietorship",
          commissionRate: 10,
          kycStatus: "verified",
          kycVerifiedAt: new Date(),
          kycReviewedBy: admin._id,
          panNumber: "ABCDE1234F",
          aadhaarNumber: "123456789012",
          bankDetails: {
            accountHolderName: "Jaipur Craft Atelier",
            accountNumber: "50100234567890",
            ifscCode: "HDFC0001234",
            bankName: "HDFC Bank Ltd",
          },
        },
      });
      console.log(`[Created] Verified Seller account: ${sellerEmail}`);
    } else {
      seller.role = "seller";
      seller.password = sellerPassword;
      seller.isEmailVerified = true;
      if (!seller.sellerProfile) seller.sellerProfile = {};
      seller.sellerProfile.businessName = "Jaipur Craft Atelier";
      seller.sellerProfile.storeSlug = "jaipur-craft-atelier";
      seller.sellerProfile.kycStatus = "verified";
      seller.sellerProfile.commissionRate = 10;
      seller.sellerProfile.bankDetails = {
        accountHolderName: "Jaipur Craft Atelier",
        accountNumber: "50100234567890",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank Ltd",
      };
      await seller.save();
      console.log(`[Updated] Verified Seller account: ${sellerEmail}`);
    }

    // 3. Test Customer Account
    const customerEmail = "customer@lyzov.com";
    const customerPassword = "Customer@1234";

    let customer = await User.findOne({ email: customerEmail }).select("+password");
    if (!customer) {
      customer = await User.create({
        name: "Rahul Sharma",
        email: customerEmail,
        password: customerPassword,
        role: "customer",
        isEmailVerified: true,
        phone: "+91 9123456789",
      });
      console.log(`[Created] Customer account: ${customerEmail}`);
    } else {
      customer.role = "customer";
      customer.password = customerPassword;
      customer.isEmailVerified = true;
      await customer.save();
      console.log(`[Updated] Customer account: ${customerEmail}`);
    }

    console.log("\n========================================================");
    console.log("  TEST USERS SEEDED SUCCESSFULLY IN DATABASE");
    console.log("========================================================");
    console.log("1. SUPER ADMIN (Full platform & moderation governance):");
    console.log(`   - Email:    ${adminEmail}`);
    console.log(`   - Password: ${adminPassword}`);
    console.log(`   - Portal:   http://localhost:5173/admin`);
    console.log("--------------------------------------------------------");
    console.log("2. VERIFIED MERCHANT SELLER (Catalog & Payouts):");
    console.log(`   - Email:    ${sellerEmail}`);
    console.log(`   - Password: ${sellerPassword}`);
    console.log(`   - Portal:   http://localhost:5173/seller`);
    console.log(`   - Store:    http://localhost:5173/store/jaipur-craft-atelier`);
    console.log("--------------------------------------------------------");
    console.log("3. REGULAR CUSTOMER (Shopping, Checkout, Reviews):");
    console.log(`   - Email:    ${customerEmail}`);
    console.log(`   - Password: ${customerPassword}`);
    console.log(`   - Login:    http://localhost:5173/login`);
    console.log("========================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedAdminAndTestUsers();
