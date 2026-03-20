const LoyaltyTier = require("../models/loyaltyTier.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllLoyaltyTiers = async (req, res) => {
  try {
    const tiers = await LoyaltyTier.find().sort({ priorityRank: 1 });
    res.status(200).json({ success: true, message: "Get all loyalty tiers successfully", count: tiers.length, data: tiers });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getLoyaltyTierById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const tier = await LoyaltyTier.findById(id);
    if (!tier) return res.status(404).json({ success: false, message: "Loyalty tier not found" });
    res.status(200).json({ success: true, message: "Get loyalty tier successfully", data: tier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createLoyaltyTier = async (req, res) => {
  try {
    const { tierCode, tierName } = req.body;
    if (!tierCode || !tierName) return res.status(400).json({ success: false, message: "tierCode and tierName are required" });
    const tier = await LoyaltyTier.create(req.body);
    res.status(201).json({ success: true, message: "Loyalty tier created successfully", data: tier });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Tier code already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLoyaltyTier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const tier = await LoyaltyTier.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!tier) return res.status(404).json({ success: false, message: "Loyalty tier not found" });
    res.status(200).json({ success: true, message: "Loyalty tier updated successfully", data: tier });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Tier code already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLoyaltyTier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const tier = await LoyaltyTier.findByIdAndDelete(id);
    if (!tier) return res.status(404).json({ success: false, message: "Loyalty tier not found" });
    res.status(200).json({ success: true, message: "Loyalty tier deleted successfully", data: tier });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllLoyaltyTiers, getLoyaltyTierById, createLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier };
