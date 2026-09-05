const express = require("express");
const { body } = require("express-validator");
const {
  updateProfile,
  updateSellerProfile,
  deleteSellerDocument,
  changePassword,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(protect);

router.put("/profile", upload.single("avatar"), updateProfile);
router.put(
  "/seller/profile",
  authorize("seller", "admin"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "panDocument", maxCount: 1 },
    { name: "aadhaarDocument", maxCount: 1 },
  ]),
  updateSellerProfile
);
router.delete(
  "/seller/document/:docType",
  authorize("seller", "admin"),
  deleteSellerDocument
);
router.put(
  "/change-password",
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("New password must contain at least one number"),
  ],
  validate,
  changePassword
);

router.get("/", authorize("seller"), getUsers);
router.put("/:id", authorize("seller"), updateUser);
router.delete("/:id", authorize("seller"), deleteUser);

module.exports = router;
