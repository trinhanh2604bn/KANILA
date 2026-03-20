const CheckoutAddress = require("../models/checkoutAddress.model");
const CheckoutSession = require("../models/checkoutSession.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/checkout-addresses
const getAllCheckoutAddresses = async (req, res) => {
  try {
    const addresses = await CheckoutAddress.find()
      .populate("checkoutSessionId", "checkoutStatus")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all checkout addresses successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-addresses/:id
const getCheckoutAddressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await CheckoutAddress.findById(id).populate("checkoutSessionId", "checkoutStatus");

    if (!address) {
      return res.status(404).json({ success: false, message: "Checkout address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get checkout address successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-addresses/session/:checkoutSessionId
const getAddressesBySessionId = async (req, res) => {
  try {
    const { checkoutSessionId } = req.params;

    if (!validateObjectId(checkoutSessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const addresses = await CheckoutAddress.find({ checkoutSessionId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get addresses by session successfully",
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-addresses
const createCheckoutAddress = async (req, res) => {
  try {
    const { checkoutSessionId, addressType, recipientName, phone, addressLine1, city, isSelected } = req.body;

    if (!checkoutSessionId || !addressType || !recipientName || !phone || !addressLine1 || !city) {
      return res.status(400).json({
        success: false,
        message: "checkoutSessionId, addressType, recipientName, phone, addressLine1, and city are required",
      });
    }

    if (!validateObjectId(checkoutSessionId)) {
      return res.status(400).json({ success: false, message: "Invalid checkoutSessionId" });
    }

    const sessionExists = await CheckoutSession.findById(checkoutSessionId);
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    // If isSelected, unselect others of same type in this session
    if (isSelected === true) {
      await CheckoutAddress.updateMany(
        { checkoutSessionId, addressType, isSelected: true },
        { isSelected: false }
      );
    }

    const address = await CheckoutAddress.create(req.body);

    // Update the session's selected address ref
    if (isSelected === true) {
      const updateField = addressType === "shipping"
        ? { selectedShippingAddressId: address._id }
        : { selectedBillingAddressId: address._id };
      await CheckoutSession.findByIdAndUpdate(checkoutSessionId, updateField);
    }

    res.status(201).json({
      success: true,
      message: "Checkout address created successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/checkout-addresses/:id
const updateCheckoutAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { isSelected } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const existing = await CheckoutAddress.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout address not found" });
    }

    // If setting as selected, unselect others of same type
    if (isSelected === true) {
      await CheckoutAddress.updateMany(
        { checkoutSessionId: existing.checkoutSessionId, addressType: existing.addressType, _id: { $ne: id }, isSelected: true },
        { isSelected: false }
      );
    }

    const address = await CheckoutAddress.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // Update session ref if selecting
    if (isSelected === true) {
      const updateField = address.addressType === "shipping"
        ? { selectedShippingAddressId: address._id }
        : { selectedBillingAddressId: address._id };
      await CheckoutSession.findByIdAndUpdate(address.checkoutSessionId, updateField);
    }

    res.status(200).json({
      success: true,
      message: "Checkout address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/checkout-addresses/:id
const deleteCheckoutAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const address = await CheckoutAddress.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({ success: false, message: "Checkout address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Checkout address deleted successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCheckoutAddresses,
  getCheckoutAddressById,
  getAddressesBySessionId,
  createCheckoutAddress,
  updateCheckoutAddress,
  deleteCheckoutAddress,
};
