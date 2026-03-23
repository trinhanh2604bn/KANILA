const Refund = require("../models/refund.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderFk } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().populate("order_id", "order_number").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all refunds successfully", count: refunds.length, data: refunds });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const refund = await Refund.findById(id)
      .populate("order_id", "order_number")
      .populate("requestedByAccountId", "email")
      .populate("approvedByAccountId", "email");
    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });
    res.status(200).json({ success: true, message: "Get refund successfully", data: refund });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getRefundsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const refunds = await Refund.find({ order_id: orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get refunds by order successfully", count: refunds.length, data: refunds });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createRefund = async (req, res) => {
  try {
    const payload = normalizeOrderFk(req.body);
    const { order_id, requestedAmount } = payload;
    if (!order_id || requestedAmount === undefined) return res.status(400).json({ success: false, message: "order_id and requestedAmount are required" });
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const refund = await Refund.create(payload);
    res.status(201).json({ success: true, message: "Refund created successfully", data: refund });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const refund = await Refund.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });
    res.status(200).json({ success: true, message: "Refund updated successfully", data: refund });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteRefund = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const refund = await Refund.findByIdAndDelete(id);
    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });
    res.status(200).json({ success: true, message: "Refund deleted successfully", data: refund });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllRefunds, getRefundById, getRefundsByOrderId, createRefund, updateRefund, deleteRefund };
