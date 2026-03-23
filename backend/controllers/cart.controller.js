const Cart = require("../models/cart.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");
const { normalizeCartBody } = require("../utils/cartCheckoutNormalize");

const CUST = "customer_code full_name";

// GET /api/carts
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("customer_id", CUST)
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all carts successfully",
      count: carts.length,
      data: carts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/:id
const getCartById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findById(id).populate("customer_id", CUST);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get cart successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/carts/customer/:customer_id
const getCartsByCustomerId = async (req, res) => {
  try {
    const customer_id = req.params.customer_id ?? req.params.customerId;

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const carts = await Cart.find({ customer_id }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get carts by customer successfully",
      count: carts.length,
      data: carts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/carts
const createCart = async (req, res) => {
  try {
    const customer_id = pickCustomerId(req.body);

    if (!customer_id) {
      return res.status(400).json({ success: false, message: "customer_id is required" });
    }

    if (!validateObjectId(customer_id)) {
      return res.status(400).json({ success: false, message: "Invalid customer_id" });
    }

    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const payload = normalizeCartBody({ ...req.body, customer_id });
    delete payload.customerId;

    const cart = await Cart.create(payload);

    res.status(201).json({
      success: true,
      message: "Cart created successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/carts/:id
const updateCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findByIdAndUpdate(id, normalizeCartBody(req.body), {
      new: true,
      runValidators: true,
    });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/carts/:id
const deleteCart = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid cart ID" });
    }

    const cart = await Cart.findByIdAndDelete(id);

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCarts,
  getCartById,
  getCartsByCustomerId,
  createCart,
  updateCart,
  deleteCart,
};
