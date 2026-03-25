const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const recommendationAnalyticsRoutes = require("./recommendation-analytics.route");
const { getPendingReviews, approveReview, rejectReview } = require("../controllers/adminReview.controller");

router.get("/dashboard-summary", authMiddleware, getDashboardSummary);
router.use("/recommendations/analytics", recommendationAnalyticsRoutes);

// Review moderation
router.get("/reviews/pending", authMiddleware, getPendingReviews);
router.patch("/reviews/:id/approve", authMiddleware, approveReview);
router.patch("/reviews/:id/reject", authMiddleware, rejectReview);

module.exports = router;
