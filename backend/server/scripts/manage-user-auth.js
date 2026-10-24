const path = require("path");
const dns = require("dns");
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const emailService = require("../services/emailService");

async function run() {
  const targetEmail = (process.argv[2] || "aonesoftek@gmail.com").toLowerCase().trim();
  const setPasswordArg = process.argv[3]; // optional new password

  console.log("Connecting to MongoDB...");
  await connectDB(3, 2000);

  console.log(`\nSearching for user with email: ${targetEmail}`);
  let user = await User.findOne({ email: targetEmail });

  if (!user) {
    console.warn(`User ${targetEmail} not found! Searching for similar emails...`);
    const similar = await User.find({ email: { $regex: targetEmail.split("@")[0], $options: "i" } });
    if (similar.length > 0) {
      console.log("Found similar users:", similar.map(u => ({ id: u._id, email: u.email, role: u.role, name: u.name })));
    } else {
      console.log("Listing recent 10 users in database:");
      const recent = await User.find({}, "name email role isEmailVerified createdAt").sort({ createdAt: -1 }).limit(10);
      console.log(recent);
    }
    await mongoose.disconnect();
    return;
  }

  console.log("User found:", {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isBlocked: user.isBlocked,
    authProvider: user.authProvider,
  });

  user.isEmailVerified = true;
  user.isActive = true;

  if (setPasswordArg) {
    console.log(`\nSetting direct password for user to: ${setPasswordArg}`);
    user.password = setPasswordArg; // Pre-save hook hashes it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();
    console.log("Password directly updated in DB successfully!");
    await mongoose.disconnect();
    return;
  }
  await user.save({ validateBeforeSave: false });

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  // Extend expiration to 24 hours so user has plenty of time
  user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const prodResetUrl = `https://lyzov.com/reset-password/${resetToken}`;
  const localResetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  console.log("\n========================================================");
  console.log("PASSWORD RESET LINKS GENERATED:");
  console.log(`Production URL: ${prodResetUrl}`);
  console.log(`Local Dev URL:   ${localResetUrl}`);
  console.log(`Token expires:  ${new Date(user.passwordResetExpires).toISOString()}`);
  console.log("========================================================\n");

  // Attempt to send email via SMTP / service
  console.log("Attempting to send reset email to " + user.email + "...");
  try {
    const sendResult = await emailService.sendPasswordReset({
      user,
      resetUrl: prodResetUrl,
    });
    console.log("Email dispatch result:", sendResult);
  } catch (err) {
    console.error("Email sending failed with error:", err.message);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
