const CheckoutSession = require("../models/checkoutSession.model");
const Cart = require("../models/cart.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");
const { normalizeCheckoutSessionBody } = require("../utils/cartCheckoutNormalize");

const CUST = "customer_code full_name";

// GET /api/checkout-sessions
const getAllCheckoutSessions = async (req, res) => {
  try {
    const sessions = await CheckoutSession.find()
      .populate("cart_id", "cart_status item_count total_amount")
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

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
      .populate("cart_id", "cart_status item_count total_amount")
      .populate("customer_id", CUST)
      .populate("selected_shipping_address_id")
      .populate("selected_billing_address_id")
      .populate("selected_shipping_method_id")
      .populate("selected_payment_method_id");

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

// GET /api/checkout-sessions/cart/:cart_id
const getSessionsByCartId = async (req, res) => {
  try {
    const cart_id = req.params.cart_id ?? req.params.cartId;

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const sessions = await CheckoutSession.find({ cart_id })
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

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
    const body = normalizeCheckoutSessionBody(req.body);
    const cart_id = body.cart_id ?? req.body.cartId;
    const customer_id = pickCustomerId(req.body);

    if (!cart_id || !customer_id) {
      return res.status(400).json({
        success: false,
        message: "cart_id and customer_id are required",
      });
    }

    if (!validateObjectId(cart_id)) {
      return res.status(400).json({ success: false, message: "Invalid cart_id" });
    }
    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    const cartExists = await Cart.findById(cart_id);
    if (!cartExists) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (body.subtotal_amount === undefined && cartExists.subtotal_amount != null) {
      body.subtotal_amount = cartExists.subtotal_amount;
    }

    const sub = body.subtotal_amount || 0;
    const ship = body.shipping_fee_amount || 0;
    const tax = body.tax_amount || 0;
    const disc = body.discount_amount || 0;
    body.total_amount = sub + ship + tax - disc;

    const payload = { ...body, cart_id, customer_id };
    delete payload.customerId;
    delete payload.cartId;

    const session = await CheckoutSession.create(payload);

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

    const body = normalizeCheckoutSessionBody(req.body);
    const sub =
      body.subtotal_amount !== undefined ? body.subtotal_amount : existing.subtotal_amount;
    const ship =
      body.shipping_fee_amount !== undefined ? body.shipping_fee_amount : existing.shipping_fee_amount;
    const tax = body.tax_amount !== undefined ? body.tax_amount : existing.tax_amount;
    const disc = body.discount_amount !== undefined ? body.discount_amount : existing.discount_amount;
    body.total_amount = sub + ship + tax - disc;

    const session = await CheckoutSession.findByIdAndUpdate(id, body, {
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
