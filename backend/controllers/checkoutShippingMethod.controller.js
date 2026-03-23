const CheckoutShippingMethod = require("../models/checkoutShippingMethod.model");
const CheckoutSession = require("../models/checkoutSession.model");
const ShippingMethod = require("../models/shippingMethod.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeCheckoutShippingMethodBody } = require("../utils/cartCheckoutNormalize");

// GET /api/checkout-shipping-methods
const getAllCheckoutShippingMethods = async (req, res) => {
  try {
    const methods = await CheckoutShippingMethod.find()
      .populate("checkout_session_id", "checkout_status")
      .populate("shipping_method_id", "shipping_method_code shipping_method_name")
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all checkout shipping methods successfully",
      count: methods.length,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-shipping-methods/:id
const getCheckoutShippingMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const method = await CheckoutShippingMethod.findById(id)
      .populate("checkout_session_id", "checkout_status")
      .populate("shipping_method_id", "shipping_method_code shipping_method_name");

    if (!method) {
      return res.status(404).json({ success: false, message: "Checkout shipping method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get checkout shipping method successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-shipping-methods/session/:checkout_session_id
const getMethodsBySessionId = async (req, res) => {
  try {
    const checkout_session_id =
      req.params.checkout_session_id ?? req.params.checkoutSessionId;

    if (!validateObjectId(checkout_session_id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const methods = await CheckoutShippingMethod.find({ checkout_session_id })
      .populate("shipping_method_id", "shipping_method_code shipping_method_name")
      .sort({ shipping_fee_amount: 1 });

    res.status(200).json({
      success: true,
      message: "Get shipping methods by session successfully",
      count: methods.length,
      data: methods,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-shipping-methods
const createCheckoutShippingMethod = async (req, res) => {
  try {
    const body = normalizeCheckoutShippingMethodBody(req.body);
    const {
      checkout_session_id,
      shipping_method_id,
      shipping_method_code,
      carrier_code,
      service_name,
      is_selected,
    } = body;

    if (
      !checkout_session_id ||
      !shipping_method_id ||
      !shipping_method_code ||
      !carrier_code ||
      !service_name
    ) {
      return res.status(400).json({
        success: false,
        message:
          "checkout_session_id, shipping_method_id, shipping_method_code, carrier_code, and service_name are required",
      });
    }

    if (!validateObjectId(checkout_session_id)) {
      return res.status(400).json({ success: false, message: "Invalid checkout_session_id" });
    }
    if (!validateObjectId(shipping_method_id)) {
      return res.status(400).json({ success: false, message: "Invalid shipping_method_id" });
    }

    const sessionExists = await CheckoutSession.findById(checkout_session_id);
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    const methodExists = await ShippingMethod.findById(shipping_method_id);
    if (!methodExists) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }

    if (is_selected === true) {
      await CheckoutShippingMethod.updateMany(
        { checkout_session_id, is_selected: true },
        { is_selected: false }
      );
    }

    const method = await CheckoutShippingMethod.create(body);

    if (is_selected === true) {
      await CheckoutSession.findByIdAndUpdate(checkout_session_id, {
        selected_shipping_method_id: method._id,
        shipping_fee_amount: method.shipping_fee_amount || 0,
      });
    }

    res.status(201).json({
      success: true,
      message: "Checkout shipping method created successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/checkout-shipping-methods/:id
const updateCheckoutShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const body = normalizeCheckoutShippingMethodBody(req.body);
    const { is_selected } = body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await CheckoutShippingMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout shipping method not found" });
    }

    if (is_selected === true) {
      await CheckoutShippingMethod.updateMany(
        { checkout_session_id: existing.checkout_session_id, _id: { $ne: id }, is_selected: true },
        { is_selected: false }
      );
    }

    const method = await CheckoutShippingMethod.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (is_selected === true) {
      await CheckoutSession.findByIdAndUpdate(method.checkout_session_id, {
        selected_shipping_method_id: method._id,
        shipping_fee_amount: method.shipping_fee_amount || 0,
      });
    }

    res.status(200).json({
      success: true,
      message: "Checkout shipping method updated successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/checkout-shipping-methods/:id
const deleteCheckoutShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const method = await CheckoutShippingMethod.findByIdAndDelete(id);

    if (!method) {
      return res.status(404).json({ success: false, message: "Checkout shipping method not found" });
    }

    res.status(200).json({
      success: true,
      message: "Checkout shipping method deleted successfully",
      data: method,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCheckoutShippingMethods,
  getCheckoutShippingMethodById,
  getMethodsBySessionId,
  createCheckoutShippingMethod,
  updateCheckoutShippingMethod,
  deleteCheckoutShippingMethod,
};
