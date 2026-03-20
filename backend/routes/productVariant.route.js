const express = require("express");
const router = express.Router();
const {
  getAllProductVariants,
  getProductVariantById,
  getVariantsByProductId,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
} = require("../controllers/productVariant.controller");

router.get("/", getAllProductVariants);
router.get("/product/:productId", getVariantsByProductId);
router.get("/:id", getProductVariantById);
router.post("/", createProductVariant);
router.put("/:id", updateProductVariant);
router.delete("/:id", deleteProductVariant);

module.exports = router;
