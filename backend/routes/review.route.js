const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllReviews,
  getReviewById,
  getReviewsByProductId,
  createReview,
  updateReview,
  deleteReview,
  getReviewWriteEligibility,
  submitReviewFromOrderItem,
  submitReviewDirect,
  getMyReviews,
  patchMyReview,
  deleteMyReview,
  getReviewableItems,
} = require("../controllers/review.controller");
const { voteOnReview } = require("../controllers/reviewVote.controller");
router.get("/", getAllReviews);
router.get("/product/:productId", getReviewsByProductId);
router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

// Helpful vote for a review (auth required)
router.post("/:reviewId/vote", authMiddleware, voteOnReview);

// Authenticated review flows
router.get("/me", authMiddleware, getMyReviews);
router.get("/write-eligibility/:orderItemId", authMiddleware, getReviewWriteEligibility);
router.get("/reviewable-items/:productId", authMiddleware, getReviewableItems);
router.post("/submit", authMiddleware, submitReviewFromOrderItem);
router.post("/submit-direct", authMiddleware, submitReviewDirect);
router.patch("/me/:id", authMiddleware, patchMyReview);
router.delete("/me/:id", authMiddleware, deleteMyReview);

// Public single review read
router.get("/:id", getReviewById);
module.exports = router;
