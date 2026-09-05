const express = require("express");
const { getEmailLogs, sendTestEmail } = require("../controllers/sellerEmailController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("seller", "admin"));

router.get("/", getEmailLogs);
router.post("/test", sendTestEmail);

module.exports = router;
