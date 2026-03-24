const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const recommendationAnalyticsRoutes = require("./recommendation-analytics.route");

router.get("/dashboard-summary", authMiddleware, getDashboardSummary);
router.use("/recommendations/analytics", recommendationAnalyticsRoutes);

module.exports = router;
