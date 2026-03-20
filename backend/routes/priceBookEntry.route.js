const express = require("express");
const router = express.Router();
const {
  getAllPriceBookEntries,
  getPriceBookEntryById,
  getEntriesByPriceBookId,
  getEntriesByVariantId,
  createPriceBookEntry,
  updatePriceBookEntry,
  deletePriceBookEntry,
} = require("../controllers/priceBookEntry.controller");

router.get("/", getAllPriceBookEntries);
router.get("/price-book/:priceBookId", getEntriesByPriceBookId);
router.get("/variant/:variantId", getEntriesByVariantId);
router.get("/:id", getPriceBookEntryById);
router.post("/", createPriceBookEntry);
router.put("/:id", updatePriceBookEntry);
router.delete("/:id", deletePriceBookEntry);

module.exports = router;
