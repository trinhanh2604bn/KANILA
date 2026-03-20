const PaymentIntent = require("../models/paymentIntent.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllPaymentIntents = async (req, res) => {
  try {
    const intents = await PaymentIntent.find().populate("orderId", "orderNumber").populate("paymentMethodId", "paymentMethodCode paymentMethodName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all payment intents successfully", count: intents.length, data: intents });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getPaymentIntentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findById(id).populate("orderId", "orderNumber").populate("paymentMethodId", "paymentMethodCode paymentMethodName");
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Get payment intent successfully", data: intent });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getIntentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const intents = await PaymentIntent.find({ orderId }).populate("paymentMethodId", "paymentMethodCode paymentMethodName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get intents by order successfully", count: intents.length, data: intents });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, requestedAmount } = req.body;
    if (!orderId || requestedAmount === undefined) return res.status(400).json({ success: false, message: "orderId and requestedAmount are required" });
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid orderId" });
    const orderExists = await Order.findById(orderId);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const intent = await PaymentIntent.create(req.body);
    res.status(201).json({ success: true, message: "Payment intent created successfully", data: intent });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updatePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Payment intent updated successfully", data: intent });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deletePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findByIdAndDelete(id);
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Payment intent deleted successfully", data: intent });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllPaymentIntents, getPaymentIntentById, getIntentsByOrderId, createPaymentIntent, updatePaymentIntent, deletePaymentIntent };
