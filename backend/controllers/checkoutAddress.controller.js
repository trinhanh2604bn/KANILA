const CheckoutAddress = require("../models/checkoutAddress.model");
const CheckoutSession = require("../models/checkoutSession.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeCheckoutAddressBody } = require("../utils/cartCheckoutNormalize");

// GET /api/checkout-addresses
const getAllCheckoutAddresses = async (req, res) => {
  try {
    const addresses = await CheckoutAddress.find()
      .populate("checkout_session_id", "checkout_status")
      .sort({ created_at: -1 });

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

    const address = await CheckoutAddress.findById(id).populate(
      "checkout_session_id",
      "checkout_status"
    );

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

// GET /api/checkout-addresses/session/:checkout_session_id
const getAddressesBySessionId = async (req, res) => {
  try {
    const checkout_session_id =
      req.params.checkout_session_id ?? req.params.checkoutSessionId;

    if (!validateObjectId(checkout_session_id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const addresses = await CheckoutAddress.find({ checkout_session_id }).sort({
      created_at: -1,
    });

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
    const body = normalizeCheckoutAddressBody(req.body);
    const {
      checkout_session_id,
      address_type,
      recipient_name,
      phone,
      address_line_1,
      city,
      is_selected,
    } = body;

    if (
      !checkout_session_id ||
      !address_type ||
      !recipient_name ||
      !phone ||
      !address_line_1 ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "checkout_session_id, address_type, recipient_name, phone, address_line_1, and city are required",
      });
    }

    if (!validateObjectId(checkout_session_id)) {
      return res.status(400).json({ success: false, message: "Invalid checkout_session_id" });
    }

    const sessionExists = await CheckoutSession.findById(checkout_session_id);
    if (!sessionExists) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    if (is_selected === true) {
      await CheckoutAddress.updateMany(
        { checkout_session_id, address_type, is_selected: true },
        { is_selected: false }
      );
    }

    const address = await CheckoutAddress.create(body);

    if (is_selected === true) {
      const updateField =
        address_type === "shipping"
          ? { selected_shipping_address_id: address._id }
          : { selected_billing_address_id: address._id };
      await CheckoutSession.findByIdAndUpdate(checkout_session_id, updateField);
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
    const body = normalizeCheckoutAddressBody(req.body);
    const { is_selected } = body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid address ID" });
    }

    const existing = await CheckoutAddress.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout address not found" });
    }

    if (is_selected === true) {
      await CheckoutAddress.updateMany(
        {
          checkout_session_id: existing.checkout_session_id,
          address_type: existing.address_type,
          _id: { $ne: id },
          is_selected: true,
        },
        { is_selected: false }
      );
    }

    const address = await CheckoutAddress.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (is_selected === true) {
      const updateField =
        address.address_type === "shipping"
          ? { selected_shipping_address_id: address._id }
          : { selected_billing_address_id: address._id };
      await CheckoutSession.findByIdAndUpdate(address.checkout_session_id, updateField);
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
