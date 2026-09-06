const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { decrypt } = require("../utils/encryption");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return this.authProvider === "local";
      },
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerificationToken: String,
    phoneVerificationExpires: Date,
    sellerProfile: {
      businessName: { type: String, trim: true, default: "" },
      storeBio: { type: String, trim: true, default: "" },
      panNumber: {
        type: String,
        trim: true,
        default: "",
      },
      panDocument: {
        url: { type: String, default: "" },
        publicId: { type: String, default: "" },
      },
      aadhaarNumber: {
        type: String,
        trim: true,
        default: "",
      },
      aadhaarDocument: {
        url: { type: String, default: "" },
        publicId: { type: String, default: "" },
      },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
      businessAddress: {
        addressLine1: { type: String, default: "" },
        addressLine2: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        country: { type: String, default: "India" },
      },
      bankDetails: {
        accountHolderName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        ifscCode: { type: String, uppercase: true, default: "" },
        bankName: { type: String, default: "" },
      },
      kycStatus: {
        type: String,
        enum: ["pending", "submitted", "verified", "rejected"],
        default: "pending",
      },
      kycSubmittedAt: Date,
      kycVerifiedAt: Date,
      kycRejectionReason: { type: String, default: "" },
    },
    emailPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return token;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;

  if (obj.sellerProfile) {
    if (obj.sellerProfile.panNumber) {
      obj.sellerProfile.panNumber = decrypt(obj.sellerProfile.panNumber);
    }
    if (obj.sellerProfile.aadhaarNumber) {
      obj.sellerProfile.aadhaarNumber = decrypt(obj.sellerProfile.aadhaarNumber);
    }
  }

  return obj;
};

module.exports = mongoose.model("User", userSchema);
