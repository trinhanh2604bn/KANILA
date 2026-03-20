const express = require("express");
const router = express.Router();
const {
  getAllVariantOptionValues,
  getVariantOptionValueById,
  getValuesByVariantId,
  createVariantOptionValue,
  updateVariantOptionValue,
  deleteVariantOptionValue,
} = require("../controllers/variantOptionValue.controller");

router.get("/", getAllVariantOptionValues);
router.get("/variant/:variantId", getValuesByVariantId);
router.get("/:id", getVariantOptionValueById);
router.post("/", createVariantOptionValue);
router.put("/:id", updateVariantOptionValue);
router.delete("/:id", deleteVariantOptionValue);

module.exports = router;
