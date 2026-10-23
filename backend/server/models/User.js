const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const slugify = require("slugify");
const { decrypt, maskPan, maskAadhaar } = require("../utils/encryption");

// KYC document metadata. `accessType: "authenticated"` documents are stored privately on
// Cloudinary and can only be viewed through short-lived signed URLs (see kycDocumentService).
const kycDocumentSchema = {
  url: { type: String, default: "" },
  publicId: { type: String, default: "" },
  accessType: { type: String, enum: ["public", "authenticated"], default: "public" },
  format: { type: String, default: "" },
  resourceType: { type: String, default: "image" },
};

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
      // Public storefront handle: /store/:storeSlug
      storeSlug: { type: String, trim: true, lowercase: true },
      storeBio: { type: String, trim: true, default: "" },
      // Optional per-seller commission override (percent). null = platform default.
      commissionRate: { type: Number, min: 0, max: 100, default: null },
      onboardingSource: { type: String, enum: ["invite", "self"], default: "invite" },
      panNumber: {
        type: String,
        trim: true,
        default: "",
      },
      panDocument: kycDocumentSchema,
      aadhaarNumber: {
        type: String,
        trim: true,
        default: "",
      },
      aadhaarDocument: kycDocumentSchema,
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
      kycReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      kycReviewedAt: Date,
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
    profileComplete: {
      type: Boolean,
      default: false,
      comment: "true when user has added phone + at least one address",
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index(
  { "sellerProfile.storeSlug": 1 },
  { unique: true, partialFilterExpression: { "sellerProfile.storeSlug": { $type: "string" } } }
);
userSchema.index({ role: 1, "sellerProfile.kycStatus": 1 });

// Generate a unique public store slug for sellers once they have a business name.
userSchema.pre("save", async function (next) {
  try {
    if (this.role !== "seller") return next();
    const businessName = this.sellerProfile?.businessName?.trim();
    if (!businessName || this.sellerProfile.storeSlug) return next();

    const base = slugify(businessName, { lower: true, strict: true }) || "store";
    let candidate = base;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const taken = await this.constructor.exists({
        "sellerProfile.storeSlug": candidate,
        _id: { $ne: this._id },
      });
      if (!taken) break;
      candidate = `${base}-${crypto.randomBytes(2).toString("hex")}`;
    }
    this.sellerProfile.storeSlug = candidate;
    return next();
  } catch (err) {
    return next(err);
  }
});

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

/**
 * Serialise a user for API responses.
 * KYC identity numbers are masked by default; pass { revealKyc: true } only from
 * endpoints that are explicitly authorised to see them (admin KYC review).
 */
userSchema.methods.toSafeObject = function ({ revealKyc = false } = {}) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;

  if (obj.sellerProfile) {
    if (obj.sellerProfile.panNumber) {
      const pan = decrypt(obj.sellerProfile.panNumber);
      obj.sellerProfile.panNumber = revealKyc ? pan : maskPan(pan);
    }
    if (obj.sellerProfile.aadhaarNumber) {
      const aadhaar = decrypt(obj.sellerProfile.aadhaarNumber);
      obj.sellerProfile.aadhaarNumber = revealKyc ? aadhaar : maskAadhaar(aadhaar);
    }
    // Never expose raw private document locations; clients use the signed-URL endpoint.
    ["panDocument", "aadhaarDocument"].forEach((key) => {
      const doc = obj.sellerProfile[key];
      if (doc) {
        obj.sellerProfile[key] = {
          uploaded: Boolean(doc.publicId || doc.url),
          accessType: doc.accessType || "authenticated",
          format: doc.format,
          url: revealKyc ? (doc.url || "") : null,
        };
      }
    });
  }

  return obj;
};

module.exports = mongoose.model("User", userSchema);
