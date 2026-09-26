const express = require("express");
const router = express.Router();
const { getSiteSettings, updateSiteSettings } = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public route to fetch development mode status & banner text for storefront
router.get("/", getSiteSettings);

// Admin / Seller route to toggle development mode & edit message
router.put("/", protect, authorize("admin", "seller"), updateSiteSettings);

module.exports = router;
