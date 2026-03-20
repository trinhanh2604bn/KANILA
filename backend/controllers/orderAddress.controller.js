const OrderAddress = require("../models/orderAddress.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllOrderAddresses = async (req, res) => {
  try {
    const addresses = await OrderAddress.find().populate("orderId", "orderNumber").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all order addresses successfully", count: addresses.length, data: addresses });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getOrderAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const address = await OrderAddress.findById(id).populate("orderId", "orderNumber");
    if (!address) return res.status(404).json({ success: false, message: "Order address not found" });
    res.status(200).json({ success: true, message: "Get order address successfully", data: address });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getAddressesByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const addresses = await OrderAddress.find({ orderId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get addresses by order successfully", count: addresses.length, data: addresses });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createOrderAddress = async (req, res) => {
  try {
    const { orderId, addressType, recipientName, phone, addressLine1, city } = req.body;
    if (!orderId || !addressType || !recipientName || !phone || !addressLine1 || !city) {
      return res.status(400).json({ success: false, message: "orderId, addressType, recipientName, phone, addressLine1, and city are required" });
    }
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const address = await OrderAddress.create(req.body);
    res.status(201).json({ success: true, message: "Order address created successfully", data: address });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const address = await OrderAddress.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!address) return res.status(404).json({ success: false, message: "Order address not found" });
    res.status(200).json({ success: true, message: "Order address updated successfully", data: address });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteOrderAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid address ID" });
    const address = await OrderAddress.findByIdAndDelete(id);
    if (!address) return res.status(404).json({ success: false, message: "Order address not found" });
    res.status(200).json({ success: true, message: "Order address deleted successfully", data: address });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllOrderAddresses, getOrderAddressById, getAddressesByOrderId, createOrderAddress, updateOrderAddress, deleteOrderAddress };
