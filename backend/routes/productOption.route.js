const express = require("express");
const router = express.Router();
const {
  getAllProductOptions,
  getProductOptionById,
  getOptionsByProductId,
  createProductOption,
  updateProductOption,
  deleteProductOption,
} = require("../controllers/productOption.controller");

router.get("/", getAllProductOptions);
router.get("/product/:productId", getOptionsByProductId);
router.get("/:id", getProductOptionById);
router.post("/", createProductOption);
router.put("/:id", updateProductOption);
router.delete("/:id", deleteProductOption);

module.exports = router;
