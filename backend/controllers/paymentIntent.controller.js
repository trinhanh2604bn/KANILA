const PaymentIntent = require("../models/paymentIntent.model");
const Order = require("../models/order.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizePaymentIntentBody } = require("../utils/cartCheckoutNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllPaymentIntents = async (req, res) => {
  try {
    const intents = await PaymentIntent.find()
      .populate("order_id", "order_number")
      .populate("payment_method_id", "payment_method_code payment_method_name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Get all payment intents successfully",
      count: intents.length,
      data: intents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentIntentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findById(id)
      .populate("order_id", "order_number")
      .populate("payment_method_id", "payment_method_code payment_method_name");
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Get payment intent successfully", data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getIntentsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const intents = await PaymentIntent.find({ order_id: orderId })
      .populate("payment_method_id", "payment_method_code payment_method_name")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Get intents by order successfully",
      count: intents.length,
      data: intents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const body = normalizePaymentIntentBody(req.body);
    const { order_id, requestedAmount } = body;
    if (!order_id || requestedAmount === undefined) {
      return res.status(400).json({ success: false, message: "order_id and requestedAmount are required" });
    }
    if (!validateObjectId(order_id)) return res.status(400).json({ success: false, message: "Invalid order_id" });
    const orderExists = await Order.findById(order_id);
    if (!orderExists) return res.status(404).json({ success: false, message: "Order not found" });
    const intent = await PaymentIntent.create(body);
    res.status(201).json({ success: true, message: "Payment intent created successfully", data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findByIdAndUpdate(id, normalizePaymentIntentBody(req.body), {
      new: true,
      runValidators: true,
    });
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Payment intent updated successfully", data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePaymentIntent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const intent = await PaymentIntent.findByIdAndDelete(id);
    if (!intent) return res.status(404).json({ success: false, message: "Payment intent not found" });
    res.status(200).json({ success: true, message: "Payment intent deleted successfully", data: intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPaymentIntents,
  getPaymentIntentById,
  getIntentsByOrderId,
  createPaymentIntent,
  updatePaymentIntent,
  deletePaymentIntent,
};
