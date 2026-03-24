const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getMyRecommendations,
  previewRecommendations,
} = require("../controllers/recommendation.controller");

router.get("/me", authMiddleware, getMyRecommendations);
router.post("/preview", previewRecommendations);

module.exports = router;
