const InventoryBalance = require("../models/inventoryBalance.model");
const Warehouse = require("../models/warehouse.model");
const ProductVariant = require("../models/productVariant.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");
const { parseStorefrontFacetFlag } = require("../utils/storefrontFacetScope");
const { loadInventoryBalancesStorefront } = require("../services/catalogStorefrontFacets.service");

// Helper: calculate availableQty
const calcAvailable = (onHandQty, reservedQty, blockedQty) => {
  const available = (onHandQty || 0) - (reservedQty || 0) - (blockedQty || 0);
  return Math.max(available, 0);
};

// GET /api/inventory-balances (catalog only needs variant + available qty; omit warehouse joins for list-all)
// Optional `storefrontOnly=1`: balances for variants of storefront-visible products only.
const getAllInventoryBalances = async (req, res) => {
  try {
    let balances;
    if (parseStorefrontFacetFlag(req.query)) {
      balances = await loadInventoryBalancesStorefront();
    } else {
      balances = await InventoryBalance.find()
        .select("variantId availableQty onHandQty reservedQty blockedQty")
        .sort({ createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      message: "Get all inventory balances successfully",
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-balances/:id
const getInventoryBalanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid balance ID" });
    }

    const balance = await InventoryBalance.findById(id)
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName productId");

    if (!balance) {
      return res.status(404).json({ success: false, message: "Inventory balance not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get inventory balance successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-balances/warehouse/:warehouseId
const getBalancesByWarehouseId = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    if (!validateObjectId(warehouseId)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const balances = await InventoryBalance.find({ warehouseId })
      .populate("variantId", "sku variantName productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get balances by warehouse successfully",
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-balances/product/:productId (PDP: balances only for this product’s variants)
const getBalancesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const variants = await ProductVariant.find({ productId }).select("_id").lean();
    const variantIds = variants.map((v) => v._id);
    if (!variantIds.length) {
      return res.status(200).json({
        success: true,
        message: "Get balances by product successfully",
        count: 0,
        data: [],
      });
    }
    const balances = await InventoryBalance.find({ variantId: { $in: variantIds } })
      .select("variantId availableQty onHandQty reservedQty blockedQty")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Get balances by product successfully",
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory-balances/variant/:variantId
const getBalancesByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const balances = await InventoryBalance.find({ variantId })
      .populate("warehouseId", "warehouseCode warehouseName")
      .populate("variantId", "sku variantName productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get balances by variant successfully",
      count: balances.length,
      data: balances,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/inventory-balances
const createInventoryBalance = async (req, res) => {
  try {
    const { warehouseId, variantId } = req.body;

    if (!warehouseId || !variantId) {
      return res.status(400).json({
        success: false,
        message: "warehouseId and variantId are required",
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

    // Auto-calculate availableQty
    const onHandQty = req.body.onHandQty || 0;
    const reservedQty = req.body.reservedQty || 0;
    const blockedQty = req.body.blockedQty || 0;
    req.body.availableQty = calcAvailable(onHandQty, reservedQty, blockedQty);

    const balance = await InventoryBalance.create(req.body);

    res.status(201).json({
      success: true,
      message: "Inventory balance created successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/inventory-balances/:id
const updateInventoryBalance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid balance ID" });
    }

    const existing = await InventoryBalance.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Inventory balance not found" });
    }

    // Merge with existing values for calculation
    const onHandQty = req.body.onHandQty !== undefined ? req.body.onHandQty : existing.onHandQty;
    const reservedQty = req.body.reservedQty !== undefined ? req.body.reservedQty : existing.reservedQty;
    const blockedQty = req.body.blockedQty !== undefined ? req.body.blockedQty : existing.blockedQty;

    // Auto-calculate availableQty
    req.body.availableQty = calcAvailable(onHandQty, reservedQty, blockedQty);

    const balance = await InventoryBalance.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Inventory balance updated successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/inventory-balances/:id
const deleteInventoryBalance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid balance ID" });
    }

    const balance = await InventoryBalance.findByIdAndDelete(id);

    if (!balance) {
      return res.status(404).json({ success: false, message: "Inventory balance not found" });
    }

    res.status(200).json({
      success: true,
      message: "Inventory balance deleted successfully",
      data: balance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllInventoryBalances,
  getInventoryBalanceById,
  getBalancesByWarehouseId,
  getBalancesByProductId,
  getBalancesByVariantId,
  createInventoryBalance,
  updateInventoryBalance,
  deleteInventoryBalance,
};
