const ShippingMethod = require("../models/shippingMethod.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeShippingMethodBody } = require("../utils/cartCheckoutNormalize");

// GET /api/shipping-methods
const getAllShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find().sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all shipping methods successfully",
      count: methods.length,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/shipping-methods/:id
const getShippingMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid shipping method ID" });
    }

    const method = await ShippingMethod.findById(id);

    if (!method) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get shipping method successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/shipping-methods
const createShippingMethod = async (req, res) => {
  try {
    const body = normalizeShippingMethodBody(req.body);
    const { shipping_method_code, shipping_method_name, carrier_code } = body;

    if (!shipping_method_code || !shipping_method_name || !carrier_code) {
      return res.status(400).json({
        success: false,
        message: "shipping_method_code, shipping_method_name, and carrier_code are required",
      });
    }

    const method = await ShippingMethod.create(body);

    res.status(201).json({
      success: true,
      message: "Shipping method created successfully",
      data: method,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Shipping method code already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/shipping-methods/:id
const updateShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid shipping method ID" });
    }

    const method = await ShippingMethod.findByIdAndUpdate(id, normalizeShippingMethodBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!method) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Shipping method updated successfully",
      data: method,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Shipping method code already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/shipping-methods/:id
const deleteShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid shipping method ID" });
    }

    const method = await ShippingMethod.findByIdAndDelete(id);

    if (!method) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Shipping method deleted successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
};
