const OrderTotal = require("../models/orderTotal.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderTotalBody } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const calcGrandTotal = (body, existing) => {
  const sub =
    body.subtotal_amount !== undefined
      ? body.subtotal_amount
      : existing
        ? existing.subtotal_amount
        : 0;
  const itemDisc =
    body.item_discount_amount !== undefined
      ? body.item_discount_amount
      : existing
        ? existing.item_discount_amount
        : 0;
  const orderDisc =
    body.order_discount_amount !== undefined
      ? body.order_discount_amount
      : existing
        ? existing.order_discount_amount
        : 0;
  const ship =
    body.shipping_fee_amount !== undefined
      ? body.shipping_fee_amount
      : existing
        ? existing.shipping_fee_amount
        : 0;
  const tax =
    body.tax_amount !== undefined ? body.tax_amount : existing ? existing.tax_amount : 0;
  return sub - itemDisc - orderDisc + ship + tax;
};

const getAllOrderTotals = async (req, res) => {
  try {
    const totals = await OrderTotal.find().populate("order_id", "order_number").sort({ created_at: -1 });
    res.status(200).json({ success: true, message: "Get all order totals successfully", count: totals.length, data: totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderTotalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const total = await OrderTotal.findById(id).populate("order_id", "order_number");
    if (!total) return res.status(404).json({ success: false, message: "Order total not found" });
    res.status(200).json({ success: true, message: "Get order total successfully", data: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTotalsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const totals = await OrderTotal.find({ order_id: orderId });
    res.status(200).json({ success: true, message: "Get totals by order successfully", count: totals.length, data: totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrderTotal = async (req, res) => {
  try {
    const payload = normalizeOrderTotalBody(req.body);
    const { order_id } = payload;
    if (!order_id) return res.status(400).json({ success: false, message: "order_id is required" });
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    payload.grand_total_amount = calcGrandTotal(payload, null);
    const total = await OrderTotal.create(payload);
    res.status(201).json({ success: true, message: "Order total created successfully", data: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderTotal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const existing = await OrderTotal.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Order total not found" });
    const payload = normalizeOrderTotalBody(req.body);
    payload.grand_total_amount = calcGrandTotal(payload, existing);
    const total = await OrderTotal.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: "Order total updated successfully", data: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOrderTotal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const total = await OrderTotal.findByIdAndDelete(id);
    if (!total) return res.status(404).json({ success: false, message: "Order total not found" });
    res.status(200).json({ success: true, message: "Order total deleted successfully", data: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllOrderTotals, getOrderTotalById, getTotalsByOrderId, createOrderTotal, updateOrderTotal, deleteOrderTotal };
