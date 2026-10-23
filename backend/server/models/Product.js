const mongoose = require("mongoose");
const slugify = require("slugify");
const GST_RATES = require("../config/gstRates");

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, trim: true },
    colorHex: { type: String, trim: true, default: "#000000" },
    size: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true },
    priceModifier: { type: Number, default: 0 },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    lyId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      match: [/^LYZOV-[A-Z0-9-]+$/, "LY ID must start with LYZOV-"],
    },
    hsnNumber: {
      type: String,
      trim: true,
      default: "",
    },
    gstRate: {
      type: String,
      enum: GST_RATES,
      default: null,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    shortDescription: {
      type: String,
      maxlength: [300, "Short description cannot exceed 300 characters"],
      default: "",
    },
    specialFeature: { type: String, trim: true, default: "" },
    color: { type: String, trim: true, default: "" },
    productSizeHeight: { type: String, trim: true, default: "" },
    productSizeLength: { type: String, trim: true, default: "" },
    productSizeWidth: { type: String, trim: true, default: "" },
    weight: { type: String, trim: true, default: "" },
    searchKeyword: { type: String, trim: true, default: "" },
    packagingSizeHeight: { type: String, trim: true, default: "" },
    packagingSizeLength: { type: String, trim: true, default: "" },
    packagingSizeWidth: { type: String, trim: true, default: "" },
    packOf: { type: String, trim: true, default: "" },
    warranty: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    manufacturer: { type: String, trim: true, default: "" },
    packer: { type: String, trim: true, default: "" },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    categoryPath: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        altText: { type: String, default: "" },
      },
    ],
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    variants: [variantSchema],
    tags: [{ type: String, trim: true, lowercase: true }],
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    numSold: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    moderationStatus: {
      type: String,
      enum: ["draft", "pending_approval", "approved", "rejected"],
      default: "approved",
    },
    moderationFeedback: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mpn: {
      type: String,
      trim: true,
      default: "",
    },
    slugHistory: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    seo: {
      metaTitle: { type: String, trim: true, default: "" },
      metaDescription: { type: String, trim: true, default: "" },
      canonicalUrl: { type: String, trim: true, default: "" },
    },
  },
  { timestamps: true }
);

productSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    const baseSlug = slugify(this.title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    const shortHash = Math.random().toString(36).substring(2, 7);
    this.slug = `${baseSlug}-${shortHash}`;
  }
  next();
});

productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.virtual("discountPercent").get(function () {
  if (this.discountPrice > 0 && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  searchKeyword: "text",
  lyId: "text",
  hsnNumber: "text",
  gstRate: "text",
});
productSchema.index({ category: 1 });
productSchema.index({ categoryPath: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ moderationStatus: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isNewArrival: 1, isTrending: 1 });
productSchema.index({ slugHistory: 1 });

module.exports = mongoose.model("Product", productSchema);
