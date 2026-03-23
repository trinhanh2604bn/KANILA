const StockReservation = require("../models/stockReservation.model");
const { normalizeStockReservationBody } = require("../utils/cartCheckoutNormalize");
const Warehouse = require("../models/warehouse.model");
const ProductVariant = require("../models/productVariant.model");
const InventoryBalance = require("../models/inventoryBalance.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/stock-reservations
const getAllStockReservations = async (req, res) => {
  try {
    const reservations = await StockReservation.find()
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all stock reservations successfully",
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stock-reservations/:id
const getStockReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid reservation ID" });
    }

    const reservation = await StockReservation.findById(id)
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName");

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Stock reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get stock reservation successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stock-reservations/warehouse/:warehouseId
const getReservationsByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    if (!validateObjectId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const reservations = await StockReservation.find({ warehouseId })
      .populate("variantId", "sku variantName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get reservations by warehouse successfully",
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/stock-reservations/variant/:variantId
const getReservationsByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const reservations = await StockReservation.find({ variantId })
      .populate("warehouseId", "warehouseCode warehouseName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get reservations by variant successfully",
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/stock-reservations
const createStockReservation = async (req, res) => {
  try {
    const { warehouseId, variantId, reservedQty } = req.body;

    if (!warehouseId || !variantId || reservedQty === undefined) {
      return res.status(400).json({
        success: false,
        message: "warehouseId, variantId, and reservedQty are required",
      });
    }

    if (reservedQty < 1) {
      return res.status(400).json({
        success: false,
        message: "reservedQty must be at least 1",
      });
    }

    if (!validateObjectId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouseId" });
    }
    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }

    const warehouseExists = await Warehouse.findById(warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const variantExists = await ProductVariant.findById(variantId);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    // Check inventory availability if balance record exists
    const balance = await InventoryBalance.findOne({ warehouseId, variantId });
    if (balance && reservedQty > balance.availableQty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${balance.availableQty}, Requested: ${reservedQty}`,
      });
    }

    const reservation = await StockReservation.create(req.body);

    res.status(201).json({
      success: true,
      message: "Stock reservation created successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/stock-reservations/:id
const updateStockReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid reservation ID" });
    }

    if (req.body.reservedQty !== undefined && req.body.reservedQty < 1) {
      return res.status(400).json({
        success: false,
        message: "reservedQty must be at least 1",
      });
    }

    const reservation = await StockReservation.findByIdAndUpdate(id, normalizeStockReservationBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Stock reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Stock reservation updated successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/stock-reservations/:id
const deleteStockReservation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid reservation ID" });
    }

    const reservation = await StockReservation.findByIdAndDelete(id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Stock reservation not found" });
    }

    res.status(200).json({
      success: true,
      message: "Stock reservation deleted successfully",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllStockReservations,
  getStockReservationById,
  getReservationsByWarehouseId,
  getReservationsByVariantId,
  createStockReservation,
  updateStockReservation,
  deleteStockReservation,
};
