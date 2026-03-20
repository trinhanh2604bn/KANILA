const OrderTotal = require("../models/orderTotal.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const calcGrandTotal = (body, existing) => {
  const sub = body.subtotalAmount !== undefined ? body.subtotalAmount : (existing ? existing.subtotalAmount : 0);
  const itemDisc = body.itemDiscountAmount !== undefined ? body.itemDiscountAmount : (existing ? existing.itemDiscountAmount : 0);
  const orderDisc = body.orderDiscountAmount !== undefined ? body.orderDiscountAmount : (existing ? existing.orderDiscountAmount : 0);
  const ship = body.shippingFeeAmount !== undefined ? body.shippingFeeAmount : (existing ? existing.shippingFeeAmount : 0);
  const tax = body.taxAmount !== undefined ? body.taxAmount : (existing ? existing.taxAmount : 0);
  return sub - itemDisc - orderDisc + ship + tax;
};

const getAllOrderTotals = async (req, res) => {
  try {
    const totals = await OrderTotal.find().populate("orderId", "orderNumber").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all order totals successfully", count: totals.length, data: totals });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getOrderTotalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const total = await OrderTotal.findById(id).populate("orderId", "orderNumber");
    if (!total) return res.status(404).json({ success: false, message: "Order total not found" });
    res.status(200).json({ success: true, message: "Get order total successfully", data: total });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getTotalsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const totals = await OrderTotal.find({ orderId });
    res.status(200).json({ success: true, message: "Get totals by order successfully", count: totals.length, data: totals });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createOrderTotal = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    req.body.grandTotalAmount = calcGrandTotal(req.body, null);
    const total = await OrderTotal.create(req.body);
    res.status(201).json({ success: true, message: "Order total created successfully", data: total });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateOrderTotal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const existing = await OrderTotal.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Order total not found" });
    req.body.grandTotalAmount = calcGrandTotal(req.body, existing);
    const total = await OrderTotal.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Order total updated successfully", data: total });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteOrderTotal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const total = await OrderTotal.findByIdAndDelete(id);
    if (!total) return res.status(404).json({ success: false, message: "Order total not found" });
    res.status(200).json({ success: true, message: "Order total deleted successfully", data: total });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllOrderTotals, getOrderTotalById, getTotalsByOrderId, createOrderTotal, updateOrderTotal, deleteOrderTotal };
