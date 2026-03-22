const Return = require("../models/return.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("orderId", "orderNumber")
      .populate("requestedByCustomerId", "fullName customerCode")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all returns successfully", count: returns.length, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const ret = await Return.findById(id).populate("orderId", "orderNumber").populate("requestedByCustomerId", "customerCode fullName").populate("approvedByAccountId", "email");
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
    res.status(200).json({ success: true, message: "Get return successfully", data: ret });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReturnsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const returns = await Return.find({ orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get returns by order successfully", count: returns.length, data: returns });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReturn = async (req, res) => {
  try {
    const { orderId, returnNumber } = req.body;
    if (!orderId || !returnNumber) return res.status(400).json({ success: false, message: "orderId and returnNumber are required" });
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const ret = await Return.create(req.body);
    res.status(201).json({ success: true, message: "Return created successfully", data: ret });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Return number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const ret = await Return.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate("orderId", "orderNumber")
      .populate("requestedByCustomerId", "fullName customerCode");
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
    res.status(200).json({ success: true, message: "Return updated successfully", data: ret });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Return number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const ret = await Return.findByIdAndDelete(id);
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
    res.status(200).json({ success: true, message: "Return deleted successfully", data: ret });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReturns, getReturnById, getReturnsByOrderId, createReturn, updateReturn, deleteReturn };
