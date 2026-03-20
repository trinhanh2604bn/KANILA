const PromotionTarget = require("../models/promotionTarget.model");
const Promotion = require("../models/promotion.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/promotion-targets
const getAllPromotionTargets = async (req, res) => {
  try {
    const targets = await PromotionTarget.find()
      .populate("promotionId", "promotionCode promotionName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all promotion targets successfully",
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/promotion-targets/:id
const getPromotionTargetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid target ID" });
    }

    const target = await PromotionTarget.findById(id).populate("promotionId", "promotionCode promotionName");

    if (!target) {
      return res.status(404).json({ success: false, message: "Promotion target not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get promotion target successfully",
      data: target,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/promotion-targets/promotion/:promotionId
const getTargetsByPromotionId = async (req, res) => {
  try {
    const { promotionId } = req.params;

    if (!validateObjectId(promotionId)) {
      return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    }

    const targets = await PromotionTarget.find({ promotionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get targets by promotion successfully",
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/promotion-targets
const createPromotionTarget = async (req, res) => {
  try {
    const { promotionId, targetType } = req.body;

    if (!promotionId || !targetType) {
      return res.status(400).json({
        success: false,
        message: "promotionId and targetType are required",
      });
    }

    if (!validateObjectId(promotionId)) {
      return res.status(400).json({ success: false, message: "Invalid promotionId" });
    }

    const promotionExists = await Promotion.findById(promotionId);
    if (!promotionExists) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    const target = await PromotionTarget.create(req.body);

    res.status(201).json({
      success: true,
      message: "Promotion target created successfully",
      data: target,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/promotion-targets/:id
const updatePromotionTarget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid target ID" });
    }

    const target = await PromotionTarget.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!target) {
      return res.status(404).json({ success: false, message: "Promotion target not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion target updated successfully",
      data: target,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/promotion-targets/:id
const deletePromotionTarget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid target ID" });
    }

    const target = await PromotionTarget.findByIdAndDelete(id);

    if (!target) {
      return res.status(404).json({ success: false, message: "Promotion target not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion target deleted successfully",
      data: target,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPromotionTargets,
  getPromotionTargetById,
  getTargetsByPromotionId,
  createPromotionTarget,
  updatePromotionTarget,
  deletePromotionTarget,
};
