const express = require("express");
const { body } = require("express-validator");
const {
  getProductReviews,
  streamProductReviews,
  checkReviewEligibility,
  createReview,
  updateReview,
  deleteReview,
  markHelpful,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const validate = require("../middleware/validateMiddleware");

const router = express.Router();

// Public review list and real-time SSE stream
router.get("/product/:productId", getProductReviews);
router.get("/product/:productId/stream", streamProductReviews);

// Private review eligibility check for authenticated customer
router.get("/product/:productId/eligibility", protect, checkReviewEligibility);

// Create a review (restricted to verified buyers)
router.post(
  "/",
  protect,
  upload.array("images", 4),
  [
    body("productId").isMongoId().withMessage("Valid product id is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
    body("comment").trim().notEmpty().withMessage("Comment is required"),
  ],
  validate,
  createReview
);

router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
router.put("/:id/helpful", protect, markHelpful);

module.exports = router;
