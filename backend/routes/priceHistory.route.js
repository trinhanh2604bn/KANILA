const express = require("express");
const router = express.Router();
const {
  getAllPriceHistory,
  getPriceHistoryById,
  getHistoryByVariantId,
  createPriceHistory,
  deletePriceHistory,
} = require("../controllers/priceHistory.controller");

router.get("/", getAllPriceHistory);
router.get("/variant/:variantId", getHistoryByVariantId);
router.get("/:id", getPriceHistoryById);
router.post("/", createPriceHistory);
router.delete("/:id", deletePriceHistory);

module.exports = router;
