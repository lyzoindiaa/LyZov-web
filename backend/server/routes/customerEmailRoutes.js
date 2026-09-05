const express = require("express");
const { getMyEmailLogs } = require("../controllers/customerEmailController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/", getMyEmailLogs);

module.exports = router;