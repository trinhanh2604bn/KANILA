const Warehouse = require("../models/warehouse.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/warehouses
const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all warehouses successfully",
      count: warehouses.length,
      data: warehouses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/warehouses/:id
const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const warehouse = await Warehouse.findById(id);

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get warehouse successfully",
      data: warehouse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/warehouses
const createWarehouse = async (req, res) => {
  try {
    const { warehouseCode, warehouseName, addressLine1, city } = req.body;

    if (!warehouseCode || !warehouseName || !addressLine1 || !city) {
      return res.status(400).json({
        success: false,
        message: "warehouseCode, warehouseName, addressLine1, and city are required",
      });
    }

    const warehouse = await Warehouse.create(req.body);

    res.status(201).json({
      success: true,
      message: "Warehouse created successfully",
      data: warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Warehouse code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/warehouses/:id
const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const warehouse = await Warehouse.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: warehouse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Warehouse code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse ID" });
    }

    const warehouse = await Warehouse.findByIdAndDelete(id);

    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
      data: warehouse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
};
