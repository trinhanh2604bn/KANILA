const express = require("express");
const router = express.Router();
const {
  getAllVariantMedia,
  getVariantMediaById,
  getMediaByVariantId,
  createVariantMedia,
  updateVariantMedia,
  deleteVariantMedia,
} = require("../controllers/variantMedia.controller");

router.get("/", getAllVariantMedia);
router.get("/variant/:variantId", getMediaByVariantId);
router.get("/:id", getVariantMediaById);
router.post("/", createVariantMedia);
router.put("/:id", updateVariantMedia);
router.delete("/:id", deleteVariantMedia);

module.exports = router;
