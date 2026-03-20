const CheckoutShippingMethod = require("../models/checkoutShippingMethod.model");
const CheckoutSession = require("../models/checkoutSession.model");
const ShippingMethod = require("../models/shippingMethod.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/checkout-shipping-methods
const getAllCheckoutShippingMethods = async (req, res) => {
  try {
    const methods = await CheckoutShippingMethod.find()
      .populate("checkoutSessionId", "checkoutStatus")
      .populate("shippingMethodId", "shippingMethodCode shippingMethodName")
      .sort({ createdAt: -1 });

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
      .populate("checkoutSessionId", "checkoutStatus")
      .populate("shippingMethodId", "shippingMethodCode shippingMethodName");

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

// GET /api/checkout-shipping-methods/session/:checkoutSessionId
const getMethodsBySessionId = async (req, res) => {
  try {
    const { checkoutSessionId } = req.params;

    if (!validateObjectId(checkoutSessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const methods = await CheckoutShippingMethod.find({ checkoutSessionId })
      .populate("shippingMethodId", "shippingMethodCode shippingMethodName")
      .sort({ shippingFeeAmount: 1 });

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
    const { checkoutSessionId, shippingMethodId, shippingMethodCode, carrierCode, serviceName, isSelected } = req.body;

    if (!checkoutSessionId || !shippingMethodId || !shippingMethodCode || !carrierCode || !serviceName) {
      return res.status(400).json({
        success: false,
        message: "checkoutSessionId, shippingMethodId, shippingMethodCode, carrierCode, and serviceName are required",
      });
    }

    if (!validateObjectId(checkoutSessionId)) {
      return res.status(400).json({ success: false, message: "Invalid checkoutSessionId" });
    }
    if (!validateObjectId(shippingMethodId)) {
      return res.status(400).json({ success: false, message: "Invalid shippingMethodId" });
    }

    const sessionExists = await CheckoutSession.findById(checkoutSessionId);
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    const methodExists = await ShippingMethod.findById(shippingMethodId);
    if (!methodExists) {
      return res.status(404).json({ success: false, message: "Shipping method not found" });
    }

    // If isSelected, unselect others in this session
    if (isSelected === true) {
      await CheckoutShippingMethod.updateMany(
        { checkoutSessionId, isSelected: true },
        { isSelected: false }
      );
    }

    const method = await CheckoutShippingMethod.create(req.body);

    // Update session's selected shipping method and fee
    if (isSelected === true) {
      await CheckoutSession.findByIdAndUpdate(checkoutSessionId, {
        selectedShippingMethodId: method._id,
        shippingFeeAmount: method.shippingFeeAmount || 0,
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
    const { isSelected } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await CheckoutShippingMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout shipping method not found" });
    }

    // If setting as selected, unselect others
    if (isSelected === true) {
      await CheckoutShippingMethod.updateMany(
        { checkoutSessionId: existing.checkoutSessionId, _id: { $ne: id }, isSelected: true },
        { isSelected: false }
      );
    }

    const method = await CheckoutShippingMethod.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update session ref if selecting
    if (isSelected === true) {
      await CheckoutSession.findByIdAndUpdate(method.checkoutSessionId, {
        selectedShippingMethodId: method._id,
        shippingFeeAmount: method.shippingFeeAmount || 0,
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
