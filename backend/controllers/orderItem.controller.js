const OrderItem = require("../models/orderItem.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderItemBody } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllOrderItems = async (req, res) => {
  try {
    const items = await OrderItem.find()
      .populate("order_id", "order_number order_status")
      .sort({ created_at: -1 });
    res.status(200).json({ success: true, message: "Get all order items successfully", count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOrderItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const item = await OrderItem.findById(id)
      .populate("order_id", "order_number order_status")
      .populate("variant_id", "sku variantName");
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Get order item successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getItemsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const items = await OrderItem.find({ order_id: orderId })
      .populate("variant_id", "sku variantName")
      .sort({ created_at: -1 });
    res.status(200).json({ success: true, message: "Get items by order successfully", count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createOrderItem = async (req, res) => {
  try {
    const payload = normalizeOrderItemBody(req.body);
    const {
      order_id,
      product_id,
      variant_id,
      sku_snapshot,
      product_name_snapshot,
      variant_name_snapshot,
      quantity,
      unit_list_price_amount,
      unit_final_price_amount,
      line_subtotal_amount,
      line_total_amount,
    } = payload;
    if (
      !order_id ||
      !product_id ||
      !variant_id ||
      !sku_snapshot ||
      !product_name_snapshot ||
      !variant_name_snapshot ||
      !quantity ||
      unit_list_price_amount === undefined ||
      unit_final_price_amount === undefined ||
      line_subtotal_amount === undefined ||
      line_total_amount === undefined
    ) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const item = await OrderItem.create(payload);
    res.status(201).json({ success: true, message: "Order item created successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const payload = normalizeOrderItemBody(req.body);
    const item = await OrderItem.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Order item updated successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteOrderItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order item ID" });
    const item = await OrderItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Order item not found" });
    res.status(200).json({ success: true, message: "Order item deleted successfully", data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllOrderItems, getOrderItemById, getItemsByOrderId, createOrderItem, updateOrderItem, deleteOrderItem };
