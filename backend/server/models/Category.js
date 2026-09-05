const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    ancestors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        level: { type: Number, required: true },
      },
    ],
    level: {
      type: Number,
      enum: [1, 2, 3], // 1: Category (Root), 2: Subcategory, 3: Item
      default: 1,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

categorySchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    if (this.parent && this.ancestors && this.ancestors.length > 0) {
      const parentSlug = this.ancestors[this.ancestors.length - 1].slug;
      this.slug = `${parentSlug}-${baseSlug}`;
    } else {
      this.slug = baseSlug;
    }
  }
  next();
});

categorySchema.index({ parent: 1, name: 1 }, { unique: true });
categorySchema.index({ "ancestors._id": 1 });
categorySchema.index({ parent: 1, displayOrder: 1 });

module.exports = mongoose.model("Category", categorySchema);

