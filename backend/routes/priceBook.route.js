const express = require("express");
const router = express.Router();
const {
  getAllPriceBooks,
  getPriceBookById,
  createPriceBook,
  updatePriceBook,
  deletePriceBook,
} = require("../controllers/priceBook.controller");

router.get("/", getAllPriceBooks);
router.get("/:id", getPriceBookById);
router.post("/", createPriceBook);
router.put("/:id", updatePriceBook);
router.delete("/:id", deletePriceBook);

module.exports = router;
