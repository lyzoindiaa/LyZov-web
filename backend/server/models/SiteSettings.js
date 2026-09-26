const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    isDevelopmentMode: {
      type: Boolean,
      default: true,
    },
    developmentMessage: {
      type: String,
      default: "LyZov Store is currently in development",
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/** Helper to get or initialize singleton site settings */
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      isDevelopmentMode: true,
      developmentMessage: "LyZov Store is currently in development",
    });
  }
  return settings;
};

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
