const PromotionRule = require("../models/promotionRule.model");
const Promotion = require("../models/promotion.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/promotion-rules
const getAllPromotionRules = async (req, res) => {
  try {
    const rules = await PromotionRule.find()
      .populate("promotionId", "promotionCode promotionName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all promotion rules successfully",
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/promotion-rules/:id
const getPromotionRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid rule ID" });
    }

    const rule = await PromotionRule.findById(id).populate("promotionId", "promotionCode promotionName");

    if (!rule) {
      return res.status(404).json({ success: false, message: "Promotion rule not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get promotion rule successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/promotion-rules/promotion/:promotionId
const getRulesByPromotionId = async (req, res) => {
  try {
    const { promotionId } = req.params;

    if (!validateObjectId(promotionId)) {
      return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    }

    const rules = await PromotionRule.find({ promotionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get rules by promotion successfully",
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/promotion-rules
const createPromotionRule = async (req, res) => {
  try {
    const { promotionId, ruleType, operator, ruleValue } = req.body;

    if (!promotionId || !ruleType || !operator || !ruleValue) {
      return res.status(400).json({
        success: false,
        message: "promotionId, ruleType, operator, and ruleValue are required",
      });
    }

    if (!validateObjectId(promotionId)) {
      return res.status(400).json({ success: false, message: "Invalid promotionId" });
    }

    const promotionExists = await Promotion.findById(promotionId);
    if (!promotionExists) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    const rule = await PromotionRule.create(req.body);

    res.status(201).json({
      success: true,
      message: "Promotion rule created successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/promotion-rules/:id
const updatePromotionRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid rule ID" });
    }

    const rule = await PromotionRule.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!rule) {
      return res.status(404).json({ success: false, message: "Promotion rule not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion rule updated successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/promotion-rules/:id
const deletePromotionRule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid rule ID" });
    }

    const rule = await PromotionRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ success: false, message: "Promotion rule not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion rule deleted successfully",
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPromotionRules,
  getPromotionRuleById,
  getRulesByPromotionId,
  createPromotionRule,
  updatePromotionRule,
  deletePromotionRule,
};
