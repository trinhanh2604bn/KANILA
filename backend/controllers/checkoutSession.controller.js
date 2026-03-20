const CheckoutSession = require("../models/checkoutSession.model");
const Cart = require("../models/cart.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/checkout-sessions
const getAllCheckoutSessions = async (req, res) => {
  try {
    const sessions = await CheckoutSession.find()
      .populate("cartId", "cartStatus itemCount totalAmount")
      .populate("customerId", "customerCode fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all checkout sessions successfully",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-sessions/:id
const getCheckoutSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await CheckoutSession.findById(id)
      .populate("cartId", "cartStatus itemCount totalAmount")
      .populate("customerId", "customerCode fullName")
      .populate("selectedShippingAddressId")
      .populate("selectedBillingAddressId")
      .populate("selectedShippingMethodId")
      .populate("selectedPaymentMethodId");

    if (!session) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get checkout session successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/checkout-sessions/cart/:cartId
const getSessionsByCartId = async (req, res) => {
  try {
    const { cartId } = req.params;

    if (!validateObjectId(cartId)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const sessions = await CheckoutSession.find({ cartId })
      .populate("customerId", "customerCode fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get sessions by cart successfully",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/checkout-sessions
const createCheckoutSession = async (req, res) => {
  try {
    const { cartId, customerId } = req.body;

    if (!cartId || !customerId) {
      return res.status(400).json({
        success: false,
        message: "cartId and customerId are required",
      });
    }

    if (!validateObjectId(cartId)) {
      return res.status(400).json({ success: false, message: "Invalid cartId" });
    }
    if (!validateObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customerId" });
    }

    const cartExists = await Cart.findById(cartId);
    if (!cartExists) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Copy subtotal from cart
    if (!req.body.subtotalAmount && cartExists.subtotalAmount) {
      req.body.subtotalAmount = cartExists.subtotalAmount;
    }

    // Calculate totalAmount
    const sub = req.body.subtotalAmount || 0;
    const ship = req.body.shippingFeeAmount || 0;
    const tax = req.body.taxAmount || 0;
    const disc = req.body.discountAmount || 0;
    req.body.totalAmount = sub + ship + tax - disc;

    const session = await CheckoutSession.create(req.body);

    res.status(201).json({
      success: true,
      message: "Checkout session created successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/checkout-sessions/:id
const updateCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const existing = await CheckoutSession.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    // Recalculate totalAmount if any pricing field changes
    const sub = req.body.subtotalAmount !== undefined ? req.body.subtotalAmount : existing.subtotalAmount;
    const ship = req.body.shippingFeeAmount !== undefined ? req.body.shippingFeeAmount : existing.shippingFeeAmount;
    const tax = req.body.taxAmount !== undefined ? req.body.taxAmount : existing.taxAmount;
    const disc = req.body.discountAmount !== undefined ? req.body.discountAmount : existing.discountAmount;
    req.body.totalAmount = sub + ship + tax - disc;

    const session = await CheckoutSession.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Checkout session updated successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/checkout-sessions/:id
const deleteCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid session ID" });
    }

    const session = await CheckoutSession.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({ success: false, message: "Checkout session not found" });
    }

    res.status(200).json({
      success: true,
      message: "Checkout session deleted successfully",
      data: session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCheckoutSessions,
  getCheckoutSessionById,
  getSessionsByCartId,
  createCheckoutSession,
  updateCheckoutSession,
  deleteCheckoutSession,
};
