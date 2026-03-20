const OrderItem = require("../models/orderItem.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllOrderItems = async (req, res) => {
  try {
    const items = await OrderItem.find().populate("orderId", "orderNumber orderStatus").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all order items successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const item = await OrderItem.findById(id).populate("orderId", "orderNumber orderStatus").populate("variantId", "sku variantName");
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Get order item successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getItemsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const items = await OrderItem.find({ orderId }).populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get items by order successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createOrderItem = async (req, res) => {
  try {
    const { orderId, productId, variantId, skuSnapshot, productNameSnapshot, variantNameSnapshot, quantity, unitListPriceAmount, unitFinalPriceAmount, lineSubtotalAmount, lineTotalAmount } = req.body;
    if (!orderId || !productId || !variantId || !skuSnapshot || !productNameSnapshot || !variantNameSnapshot || !quantity || unitListPriceAmount === undefined || unitFinalPriceAmount === undefined || lineSubtotalAmount === undefined || lineTotalAmount === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const item = await OrderItem.create(req.body);
    res.status(201).json({ success: true, message: "Order item created successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const item = await OrderItem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Order item updated successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const item = await OrderItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Order item deleted successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllOrderItems, getOrderItemById, getItemsByOrderId, createOrderItem, updateOrderItem, deleteOrderItem };
