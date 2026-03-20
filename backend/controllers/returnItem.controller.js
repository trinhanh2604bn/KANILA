const ReturnItem = require("../models/returnItem.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllReturnItems = async (req, res) => {
  try {
    const items = await ReturnItem.find().populate("returnId", "returnNumber").populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all return items successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReturnItemById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ReturnItem.findById(id).populate("returnId", "returnNumber").populate("orderItemId").populate("variantId", "sku variantName");
    if (!item) return res.status(404).json({ success: false, message: "Return item not found" });
    res.status(200).json({ success: true, message: "Get return item successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getItemsByReturnId = async (req, res) => {
  try {
    const { returnId } = req.params;
    if (!validateObjectId(returnId)) return res.status(400).json({ success: false, message: "Invalid return ID" });
    const items = await ReturnItem.find({ returnId }).populate("variantId", "sku variantName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get items by return successfully", count: items.length, data: items });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReturnItem = async (req, res) => {
  try {
    const { returnId, orderItemId, variantId, requestedQty } = req.body;
    if (!returnId || !orderItemId || !variantId || !requestedQty) return res.status(400).json({ success: false, message: "returnId, orderItemId, variantId, and requestedQty are required" });
    const item = await ReturnItem.create(req.body);
    res.status(201).json({ success: true, message: "Return item created successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateReturnItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ReturnItem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: "Return item not found" });
    res.status(200).json({ success: true, message: "Return item updated successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteReturnItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const item = await ReturnItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: "Return item not found" });
    res.status(200).json({ success: true, message: "Return item deleted successfully", data: item });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReturnItems, getReturnItemById, getItemsByReturnId, createReturnItem, updateReturnItem, deleteReturnItem };
