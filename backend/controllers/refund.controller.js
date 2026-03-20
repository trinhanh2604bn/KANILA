const Refund = require("../models/refund.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find().populate("orderId", "orderNumber").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all refunds successfully", count: refunds.length, data: refunds });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const refund = await Refund.findById(id).populate("orderId", "orderNumber").populate("requestedByAccountId", "email").populate("approvedByAccountId", "email");
    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });
    res.status(200).json({ success: true, message: "Get refund successfully", data: refund });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getRefundsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const refunds = await Refund.find({ orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get refunds by order successfully", count: refunds.length, data: refunds });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createRefund = async (req, res) => {
  try {
    const { orderId, requestedAmount } = req.body;
    if (!orderId || requestedAmount === undefined) return res.status(400).json({ success: false, message: "orderId and requestedAmount are required" });
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const refund = await Refund.create(req.body);
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
