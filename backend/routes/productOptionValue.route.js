const express = require("express");
const router = express.Router();
const {
  getAllProductOptionValues,
  getProductOptionValueById,
  getValuesByOptionId,
  createProductOptionValue,
  updateProductOptionValue,
  deleteProductOptionValue,
} = require("../controllers/productOptionValue.controller");

router.get("/", getAllProductOptionValues);
router.get("/option/:productOptionId", getValuesByOptionId);
router.get("/:id", getProductOptionValueById);
router.post("/", createProductOptionValue);
router.put("/:id", updateProductOptionValue);
router.delete("/:id", deleteProductOptionValue);

module.exports = router;
