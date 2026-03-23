const InventoryTransaction = require("../models/inventoryTransaction.model");
const Warehouse = require("../models/warehouse.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/inventory-transactions
const getAllInventoryTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find()
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName productId")
      .populate("performedByAccountId", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all inventory transactions successfully",
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-transactions/:id
const getInventoryTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }

    const transaction = await InventoryTransaction.findById(id)
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName productId")
      .populate("performedByAccountId", "email");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Inventory transaction not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get inventory transaction successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-transactions/warehouse/:warehouseId
const getTransactionsByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    if (!validateObjectId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const transactions = await InventoryTransaction.find({ warehouseId })
      .populate("variantId", "sku variantName productId")
      .populate("performedByAccountId", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get transactions by warehouse successfully",
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-transactions/variant/:variantId
const getTransactionsByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const transactions = await InventoryTransaction.find({ variantId })
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("performedByAccountId", "email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get transactions by variant successfully",
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory-transactions
const createInventoryTransaction = async (req, res) => {
  try {
    const { warehouseId, variantId, transactionType, quantityChange } = req.body;

    if (!warehouseId || !variantId || !transactionType || quantityChange === undefined) {
      return res.status(400).json({
        success: false,
        message: "warehouseId, variantId, transactionType, and quantityChange are required",
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

    const transaction = await InventoryTransaction.create(req.body);

    res.status(201).json({
      success: true,
      message: "Inventory transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/inventory-transactions/:id
const deleteInventoryTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid transaction ID" });
    }

    const transaction = await InventoryTransaction.findByIdAndDelete(id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Inventory transaction not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory transaction deleted successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllInventoryTransactions,
  getInventoryTransactionById,
  getTransactionsByWarehouseId,
  getTransactionsByVariantId,
  createInventoryTransaction,
  deleteInventoryTransaction,
};
