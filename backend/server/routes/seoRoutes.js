const express = require("express");
const { getSitemap, getRobotsTxt } = require("../controllers/sitemapController");

const router = express.Router();

router.get("/sitemap.xml", getSitemap);
router.get("/robots.txt", getRobotsTxt);

module.exports = router;
