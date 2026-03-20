const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const OrderStatusHistory = require("../models/orderStatusHistory.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "customerCode fullName")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all orders successfully", count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findById(id).populate("customerId", "customerCode fullName").populate("checkoutSessionId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, message: "Get order successfully", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/customer/:customerId
const getOrdersByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customer ID" });
    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get orders by customer successfully", count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { orderNumber, customerId } = req.body;
    if (!orderNumber || !customerId) {
      return res.status(400).json({ success: false, message: "orderNumber and customerId are required" });
    }
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customerId" });
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });

    const order = await Order.create(req.body);
    res.status(201).json({ success: true, message: "Order created successfully", data: order });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Order number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });

    const existing = await Order.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Order not found" });

    // Track status changes for history
    const statusChanged =
      (req.body.orderStatus && req.body.orderStatus !== existing.orderStatus) ||
      (req.body.paymentStatus && req.body.paymentStatus !== existing.paymentStatus) ||
      (req.body.fulfillmentStatus && req.body.fulfillmentStatus !== existing.fulfillmentStatus);

    const order = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    // Auto-create OrderStatusHistory on status change
    if (statusChanged) {
      await OrderStatusHistory.create({
        orderId: id,
        oldOrderStatus: existing.orderStatus,
        newOrderStatus: req.body.orderStatus || existing.orderStatus,
        oldPaymentStatus: existing.paymentStatus,
        newPaymentStatus: req.body.paymentStatus || existing.paymentStatus,
        oldFulfillmentStatus: existing.fulfillmentStatus,
        newFulfillmentStatus: req.body.fulfillmentStatus || existing.fulfillmentStatus,
        changedByAccountId: req.body.changedByAccountId || null,
        changeReason: req.body.changeReason || "",
      });
    }

    res.status(200).json({ success: true, message: "Order updated successfully", data: order });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Order number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/orders/:id
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, message: "Order deleted successfully", data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllOrders, getOrderById, getOrdersByCustomerId, createOrder, updateOrder, deleteOrder };
