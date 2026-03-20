const PriceHistory = require("../models/priceHistory.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/price-history
const getAllPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find()
      .populate("variantId", "sku variantName")
      .populate("priceBookId", "priceBookCode priceBookName")
      .populate("changedByAccountId", "email")
      .sort({ changedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all price history successfully",
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-history/:id
const getPriceHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid history ID" });
    }

    const history = await PriceHistory.findById(id)
      .populate("variantId", "sku variantName")
      .populate("priceBookId", "priceBookCode priceBookName")
      .populate("changedByAccountId", "email");

    if (!history) {
      return res.status(404).json({ success: false, message: "Price history not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get price history successfully",
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/price-history/variant/:variantId
const getHistoryByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const history = await PriceHistory.find({ variantId })
      .populate("priceBookId", "priceBookCode priceBookName")
      .populate("changedByAccountId", "email")
      .sort({ changedAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get price history by variant successfully",
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/price-history
const createPriceHistory = async (req, res) => {
  try {
    const { variantId, priceBookId, currencyCode } = req.body;

    if (!variantId || !priceBookId || !currencyCode) {
      return res.status(400).json({
        success: false,
        message: "variantId, priceBookId, and currencyCode are required",
      });
    }

    if (!validateObjectId(variantId) || !validateObjectId(priceBookId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId or priceBookId" });
    }

    const history = await PriceHistory.create(req.body);

    res.status(201).json({
      success: true,
      message: "Price history created successfully",
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/price-history/:id
const deletePriceHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid history ID" });
    }

    const history = await PriceHistory.findByIdAndDelete(id);

    if (!history) {
      return res.status(404).json({ success: false, message: "Price history not found" });
    }

    res.status(200).json({
      success: true,
      message: "Price history deleted successfully",
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPriceHistory,
  getPriceHistoryById,
  getHistoryByVariantId,
  createPriceHistory,
  deletePriceHistory,
};
