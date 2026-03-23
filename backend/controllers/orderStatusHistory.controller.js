const OrderStatusHistory = require("../models/orderStatusHistory.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderStatusHistoryBody } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllOrderStatusHistory = async (req, res) => {
  try {
    const history = await OrderStatusHistory.find()
      .populate("order_id", "order_number")
      .populate("changed_by_account_id", "email")
      .sort({ changed_at: -1 });
    res.status(200).json({ success: true, message: "Get all order status history successfully", count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderStatusHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const entry = await OrderStatusHistory.findById(id)
      .populate("order_id", "order_number")
      .populate("changed_by_account_id", "email");
    if (!entry) return res.status(404).json({ success: false, message: "History entry not found" });
    res.status(200).json({ success: true, message: "Get history entry successfully", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHistoryByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const history = await OrderStatusHistory.find({ order_id: orderId })
      .populate("changed_by_account_id", "email")
      .sort({ changed_at: -1 });
    res.status(200).json({ success: true, message: "Get history by order successfully", count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrderStatusHistory = async (req, res) => {
  try {
    const payload = normalizeOrderStatusHistoryBody(req.body);
    const { order_id } = payload;
    if (!order_id) return res.status(400).json({ success: false, message: "order_id is required" });
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const entry = await OrderStatusHistory.create(payload);
    res.status(201).json({ success: true, message: "History entry created successfully", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOrderStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const entry = await OrderStatusHistory.findByIdAndDelete(id);
    if (!entry) return res.status(404).json({ success: false, message: "History entry not found" });
    res.status(200).json({ success: true, message: "History entry deleted successfully", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllOrderStatusHistory,
  getOrderStatusHistoryById,
  getHistoryByOrderId,
  createOrderStatusHistory,
  deleteOrderStatusHistory,
};
