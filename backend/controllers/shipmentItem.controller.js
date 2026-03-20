const ShipmentItem = require("../models/shipmentItem.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllShipmentItems = async (req, res) => {
  try {
    const items = await ShipmentItem.find().populate("shipmentId", "shipmentNumber").populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all shipment items successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getShipmentItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ShipmentItem.findById(id).populate("shipmentId", "shipmentNumber").populate("orderItemId").populate("variantId", "sku variantName");
    if (!item) return res.status(404).json({ success: false, message: "Shipment item not found" });
    res.status(200).json({ success: true, message: "Get shipment item successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getItemsByShipmentId = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!validateObjectId(shipmentId)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const items = await ShipmentItem.find({ shipmentId }).populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get items by shipment successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createShipmentItem = async (req, res) => {
  try {
    const { shipmentId, orderItemId, variantId } = req.body;
    if (!shipmentId || !orderItemId || !variantId) return res.status(400).json({ success: false, message: "shipmentId, orderItemId, and variantId are required" });
    const item = await ShipmentItem.create(req.body);
    res.status(201).json({ success: true, message: "Shipment item created successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateShipmentItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ShipmentItem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Shipment item not found" });
    res.status(200).json({ success: true, message: "Shipment item updated successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteShipmentItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ShipmentItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Shipment item not found" });
    res.status(200).json({ success: true, message: "Shipment item deleted successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllShipmentItems, getShipmentItemById, getItemsByShipmentId, createShipmentItem, updateShipmentItem, deleteShipmentItem };
