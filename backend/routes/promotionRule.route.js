const express = require("express");
const router = express.Router();
const {
  getAllPromotionRules,
  getPromotionRuleById,
  getRulesByPromotionId,
  createPromotionRule,
  updatePromotionRule,
  deletePromotionRule,
} = require("../controllers/promotionRule.controller");

router.get("/", getAllPromotionRules);
router.get("/promotion/:promotionId", getRulesByPromotionId);
router.get("/:id", getPromotionRuleById);
router.post("/", createPromotionRule);
router.put("/:id", updatePromotionRule);
router.delete("/:id", deletePromotionRule);

module.exports = router;
