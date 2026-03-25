const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getMyRecommendations,
  previewRecommendations,
  getMyHomepageRecommendations,
  getMyAllRecommendations,
} = require("../controllers/recommendation.controller");

router.get("/me", authMiddleware, getMyRecommendations);
router.post("/preview", previewRecommendations);

// Persistent homepage snapshot endpoints
router.get("/me/homepage", authMiddleware, getMyHomepageRecommendations);
router.get("/me/all", authMiddleware, getMyAllRecommendations);

module.exports = router;
