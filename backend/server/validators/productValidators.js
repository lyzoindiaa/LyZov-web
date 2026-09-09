const { body } = require("express-validator");

const createProductValidator = [
  body("title").trim().notEmpty().withMessage("Title is required").isLength({ max: 150 }),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("brand").notEmpty().withMessage("Brand is required").isMongoId().withMessage("Invalid brand id"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category id"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("discountPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount price must be a positive number"),
  body("metaTitle").optional().trim().isLength({ max: 120 }).withMessage("Meta title cannot exceed 120 characters"),
  body("metaDescription").optional().trim().isLength({ max: 300 }).withMessage("Meta description cannot exceed 300 characters"),
  body("mpn").optional().trim(),
  body("slug").optional().trim(),
  body("productSizeHeight").trim().notEmpty().withMessage("Product height is required"),
  body("productSizeLength").trim().notEmpty().withMessage("Product length is required"),
  body("productSizeWidth").trim().notEmpty().withMessage("Product width is required"),
  body("weight").trim().notEmpty().withMessage("Product weight is required"),
  body("packOf").trim().notEmpty().withMessage("Pack of is required"),
  body("searchKeyword").optional().trim(),
];

const updateProductValidator = [
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock").optional().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("metaTitle").optional().trim().isLength({ max: 120 }).withMessage("Meta title cannot exceed 120 characters"),
  body("metaDescription").optional().trim().isLength({ max: 300 }).withMessage("Meta description cannot exceed 300 characters"),
  body("mpn").optional().trim(),
  body("slug").optional().trim(),
];

module.exports = { createProductValidator, updateProductValidator };
