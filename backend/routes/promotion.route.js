const express = require("express");
const router = express.Router();
const {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  patchPromotion,
  deletePromotion,
} = require("../controllers/promotion.controller");

router.get("/", getAllPromotions);
router.get("/:id", getPromotionById);
router.post("/", createPromotion);
router.put("/:id", updatePromotion);
router.patch("/:id", patchPromotion);
router.delete("/:id", deletePromotion);

module.exports = router;
