const Promotion = require("../models/promotion.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/promotions
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("createdByAccountId", "email")
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all promotions successfully",
      count: promotions.length,
      data: promotions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/promotions/:id
const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    }

    const promotion = await Promotion.findById(id).populate("createdByAccountId", "email");

    if (!promotion) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get promotion successfully",
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/promotions
const createPromotion = async (req, res) => {
  try {
    const { promotionName, promotionType, discountType, discountValue, startAt } = req.body;

    if (!promotionName || !promotionType || !discountType || discountValue === undefined || !startAt) {
      return res.status(400).json({
        success: false,
        message: "promotionName, promotionType, discountType, discountValue, and startAt are required",
      });
    }

    if (discountValue < 0) {
      return res.status(400).json({ success: false, message: "discountValue must not be negative" });
    }

    const promotion = await Promotion.create(req.body);

    res.status(201).json({
      success: true,
      message: "Promotion created successfully",
      data: promotion,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Promotion code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/promotions/:id
const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    }

    if (req.body.discountValue !== undefined && req.body.discountValue < 0) {
      return res.status(400).json({ success: false, message: "discountValue must not be negative" });
    }

    const promotion = await Promotion.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!promotion) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion updated successfully",
      data: promotion,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Promotion code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/promotions/:id
const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    }

    const promotion = await Promotion.findByIdAndDelete(id);

    if (!promotion) {
      return res.status(404).json({ success: false, message: "Promotion not found" });
    }

    res.status(200).json({
      success: true,
      message: "Promotion deleted successfully",
      data: promotion,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// PATCH /api/promotions/:id
const patchPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid promotion ID" });
    const allowed = ["promotionStatus", "priority", "discountValue", "endAt", "promotionName"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    if (updates.discountValue !== undefined && updates.discountValue < 0) return res.status(400).json({ success: false, message: "discountValue must not be negative" });
    const promotion = await Promotion.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!promotion) return res.status(404).json({ success: false, message: "Promotion not found" });
    res.status(200).json({ success: true, message: "Promotion patched successfully", data: promotion });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  patchPromotion,
  deletePromotion,
};
