const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getOverview,
  getTopReasons,
  getTopProducts,
  getTopBrands,
  getByContext,
  getTimeline,
} = require("../controllers/recommendation-analytics.controller");

router.get("/overview", authMiddleware, getOverview);
router.get("/top-reasons", authMiddleware, getTopReasons);
router.get("/top-products", authMiddleware, getTopProducts);
router.get("/top-brands", authMiddleware, getTopBrands);
router.get("/by-context", authMiddleware, getByContext);
router.get("/timeline", authMiddleware, getTimeline);

module.exports = router;
