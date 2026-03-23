const PaymentMethod = require("../models/paymentMethod.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizePaymentMethodBody } = require("../utils/cartCheckoutNormalize");

// GET /api/payment-methods
const getAllPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort({ sort_order: 1, created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all payment methods successfully",
      count: methods.length,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payment-methods/:id
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment method ID" });
    }

    const method = await PaymentMethod.findById(id);

    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get payment method successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payment-methods
const createPaymentMethod = async (req, res) => {
  try {
    const body = normalizePaymentMethodBody(req.body);
    const { payment_method_code, payment_method_name, method_type } = body;

    if (!payment_method_code || !payment_method_name || !method_type) {
      return res.status(400).json({
        success: false,
        message: "payment_method_code, payment_method_name, and method_type are required",
      });
    }

    const method = await PaymentMethod.create(body);

    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      data: method,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Payment method code already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/payment-methods/:id
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment method ID" });
    }

    const method = await PaymentMethod.findByIdAndUpdate(id, normalizePaymentMethodBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully",
      data: method,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Payment method code already exists" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/payment-methods/:id
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment method ID" });
    }

    const method = await PaymentMethod.findByIdAndDelete(id);

    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
