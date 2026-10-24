const express = require("express");
const {
  getProducts,
  getProductBySlug,
  getProductCollection,
  getSellerStorefront,
  createProduct,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  getMyProducts,
} = require("../controllers/productController");
const { protect, authorize, requireVerifiedSeller } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validateMiddleware");
const { createProductValidator, updateProductValidator } = require("../validators/productValidators");

const router = express.Router();

router.get("/", getProducts);
router.get("/collections/:type", getProductCollection);
router.get("/store/:storeSlug", getSellerStorefront);
router.get("/seller/mine", protect, authorize("seller", "admin"), getMyProducts);
router.get("/:slug", getProductBySlug);

router.post(
  "/",
  protect,
  authorize("seller"),
  requireVerifiedSeller,
  upload.array("images", 6),
  createProductValidator,
  validate,
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("seller"),
  requireVerifiedSeller,
  upload.array("images", 6),
  updateProductValidator,
  validate,
  updateProduct
);

router.delete("/:id/images/:imageId", protect, authorize("seller"), requireVerifiedSeller, deleteProductImage);
router.delete("/:id", protect, authorize("seller"), requireVerifiedSeller, deleteProduct);

module.exports = router;

