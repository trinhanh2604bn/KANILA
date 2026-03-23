const Return = require("../models/return.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderFk } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate("order_id", "order_number")
      .populate("requested_by_customer_id", "full_name customer_code")
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
    const ret = await Return.findById(id)
      .populate("order_id", "order_number")
      .populate("requested_by_customer_id", "customer_code full_name")
      .populate("approvedByAccountId", "email");
    if (!ret) return res.status(404).json({ success: false, message: "Return not found" });
    res.status(200).json({ success: true, message: "Get return successfully", data: ret });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReturnsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const returns = await Return.find({ order_id: orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get returns by order successfully", count: returns.length, data: returns });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReturn = async (req, res) => {
  try {
    const payload = normalizeOrderFk({ ...req.body });
    const { order_id, returnNumber } = payload;
    if (!order_id || !returnNumber) return res.status(400).json({ success: false, message: "order_id and returnNumber are required" });
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    if (payload.requestedByCustomerId && !payload.requested_by_customer_id) {
      payload.requested_by_customer_id = payload.requestedByCustomerId;
      delete payload.requestedByCustomerId;
    }
    const ret = await Return.create(payload);
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
    const ret = await Return.findByIdAndUpdate(id, normalizeOrderFk({ ...req.body }), { new: true, runValidators: true })
      .populate("order_id", "order_number")
      .populate("requested_by_customer_id", "full_name customer_code");
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
