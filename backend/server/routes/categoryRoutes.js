const express = require("express");
const {
  getCategories,
  getCategoryTree,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { body } = require("express-validator");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

router.get("/", getCategories);
router.get("/tree", getCategoryTree);
router.get("/:slug", getCategoryBySlug);

router.post(
  "/",
  protect,
  authorize("seller"),
  upload.single("image"),
  [body("name").trim().notEmpty().withMessage("Category name is required")],
  validate,
  createCategory
);
router.put("/:id", protect, authorize("seller"), upload.single("image"), updateCategory);
router.delete("/:id", protect, authorize("seller"), deleteCategory);

module.exports = router;
