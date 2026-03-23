const express = require("express");
const router = express.Router();
const {
  getAllProductCategories,
  getProductCategoryById,
  getByProductId,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} = require("../controllers/productCategory.controller");

router.get("/", getAllProductCategories);
router.get("/product/:productId", getByProductId);
router.get("/:id", getProductCategoryById);
router.post("/", createProductCategory);
router.put("/:id", updateProductCategory);
router.delete("/:id", deleteProductCategory);

module.exports = router;
