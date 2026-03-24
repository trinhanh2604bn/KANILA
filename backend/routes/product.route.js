const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
} = require("../controllers/product.controller");

router.get("/", getAllProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id", patchProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
