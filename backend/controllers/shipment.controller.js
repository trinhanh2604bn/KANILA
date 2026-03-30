const Shipment = require("../models/shipment.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderFk } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate({
        path: "order_id",
        select: "order_number customer_id order_status payment_status fulfillment_status",
        populate: { path: "customer_id", select: "full_name" },
      })
      .populate("warehouseId", "warehouseCode warehouseName")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all shipments successfully", count: shipments.length, data: shipments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getShipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const shipment = await Shipment.findById(id)
      .populate({
        path: "order_id",
        select: "order_number customer_id order_status payment_status fulfillment_status",
        populate: { path: "customer_id", select: "full_name" },
      })
      .populate("warehouseId", "warehouseCode warehouseName");
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
    res.status(200).json({ success: true, message: "Get shipment successfully", data: shipment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getShipmentsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const shipments = await Shipment.find({ order_id: orderId })
      .populate("warehouseId", "warehouseCode warehouseName")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get shipments by order successfully", count: shipments.length, data: shipments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createShipment = async (req, res) => {
  try {
    const payload = normalizeOrderFk(req.body);
    const { order_id, shipmentNumber } = payload;
    if (!order_id || !shipmentNumber) return res.status(400).json({ success: false, message: "order_id and shipmentNumber are required" });
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const shipment = await Shipment.create(payload);
    res.status(201).json({ success: true, message: "Shipment created successfully", data: shipment });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Shipment number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const shipment = await Shipment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
    res.status(200).json({ success: true, message: "Shipment updated successfully", data: shipment });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Shipment number already exists" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const shipment = await Shipment.findByIdAndDelete(id);
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
    res.status(200).json({ success: true, message: "Shipment deleted successfully", data: shipment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
// PATCH /api/shipments/:id
const patchShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const allowed = ["shipmentStatus", "trackingNumber", "carrierCode", "estimatedDelivery", "actualDelivery"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const shipment = await Shipment.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("order_id", "order_number")
      .populate("warehouseId", "warehouseCode warehouseName");
    if (!shipment) return res.status(404).json({ success: false, message: "Shipment not found" });
    res.status(200).json({ success: true, message: "Shipment patched successfully", data: shipment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllShipments, getShipmentById, getShipmentsByOrderId, createShipment, updateShipment, patchShipment, deleteShipment };
