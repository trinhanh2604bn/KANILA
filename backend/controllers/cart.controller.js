const Cart = require("../models/cart.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/carts
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate("customerId", "customerCode fullName")
      .sort({ createdAt: -1 });

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

    const cart = await Cart.findById(id).populate("customerId", "customerCode fullName");

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

// GET /api/carts/customer/:customerId
const getCartsByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!validateObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const carts = await Cart.find({ customerId }).sort({ createdAt: -1 });

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
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: "customerId is required" });
    }

    if (!validateObjectId(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customerId" });
    }

    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const cart = await Cart.create(req.body);

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

    const cart = await Cart.findByIdAndUpdate(id, req.body, {
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
