const express = require("express");
const router = express.Router();
const {
  getAllProductAttributes,
  getProductAttributeById,
  getAttributesByProductId,
  createProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
} = require("../controllers/productAttribute.controller");

router.get("/", getAllProductAttributes);
router.get("/product/:productId", getAttributesByProductId);
router.get("/:id", getProductAttributeById);
router.post("/", createProductAttribute);
router.put("/:id", updateProductAttribute);
router.delete("/:id", deleteProductAttribute);

module.exports = router;
