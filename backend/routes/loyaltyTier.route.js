const express = require("express");
const router = express.Router();
const { getAllLoyaltyTiers, getLoyaltyTierById, createLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier } = require("../controllers/loyaltyTier.controller");
router.get("/", getAllLoyaltyTiers);
router.get("/:id", getLoyaltyTierById);
router.post("/", createLoyaltyTier);
router.put("/:id", updateLoyaltyTier);
router.delete("/:id", deleteLoyaltyTier);
module.exports = router;
