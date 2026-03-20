const express = require("express");
const router = express.Router();
const {
  getAllPromotionTargets,
  getPromotionTargetById,
  getTargetsByPromotionId,
  createPromotionTarget,
  updatePromotionTarget,
  deletePromotionTarget,
} = require("../controllers/promotionTarget.controller");

router.get("/", getAllPromotionTargets);
router.get("/promotion/:promotionId", getTargetsByPromotionId);
router.get("/:id", getPromotionTargetById);
router.post("/", createPromotionTarget);
router.put("/:id", updatePromotionTarget);
router.delete("/:id", deletePromotionTarget);

module.exports = router;
