const express = require("express");
const router = express.Router();
const {
  getAllProductMedia,
  getProductMediaById,
  getMediaByProductId,
  createProductMedia,
  updateProductMedia,
  deleteProductMedia,
} = require("../controllers/productMedia.controller");

router.get("/", getAllProductMedia);
router.get("/product/:productId", getMediaByProductId);
router.get("/:id", getProductMediaById);
router.post("/", createProductMedia);
router.put("/:id", updateProductMedia);
router.delete("/:id", deleteProductMedia);

module.exports = router;
