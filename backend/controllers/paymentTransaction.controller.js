const PaymentTransaction = require("../models/paymentTransaction.model");
const validateObjectId = require("../utils/validateObjectId");
const { normalizeOrderFk } = require("../utils/orderNormalize");

function resolveOrderIdParam(req) {
  return req.params.order_id ?? req.params.orderId;
}

const getAllPaymentTransactions = async (req, res) => {
  try {
    const txns = await PaymentTransaction.find()
      .populate("paymentIntentId", "intentStatus")
      .populate("order_id", "order_number")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all payment transactions successfully", count: txns.length, data: txns });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getPaymentTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const txn = await PaymentTransaction.findById(id)
      .populate("paymentIntentId", "intentStatus")
      .populate("order_id", "order_number");
    if (!txn) return res.status(404).json({ success: false, message: "Payment transaction not found" });
    res.status(200).json({ success: true, message: "Get payment transaction successfully", data: txn });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getTransactionsByOrderId = async (req, res) => {
  try {
    const orderId = resolveOrderIdParam(req);
    if (!validateObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const txns = await PaymentTransaction.find({ order_id: orderId })
      .populate("paymentIntentId", "intentStatus")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get transactions by order successfully", count: txns.length, data: txns });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createPaymentTransaction = async (req, res) => {
  try {
    const payload = normalizeOrderFk(req.body);
    const { paymentIntentId, order_id, transactionType, amount } = payload;
    if (!paymentIntentId || !order_id || !transactionType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "paymentIntentId, order_id, transactionType, and amount are required",
      });
    }
    const txn = await PaymentTransaction.create(payload);
    res.status(201).json({ success: true, message: "Payment transaction created successfully", data: txn });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updatePaymentTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const txn = await PaymentTransaction.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!txn) return res.status(404).json({ success: false, message: "Payment transaction not found" });
    res.status(200).json({ success: true, message: "Payment transaction updated successfully", data: txn });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deletePaymentTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const txn = await PaymentTransaction.findByIdAndDelete(id);
    if (!txn) return res.status(404).json({ success: false, message: "Payment transaction not found" });
    res.status(200).json({ success: true, message: "Payment transaction deleted successfully", data: txn });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllPaymentTransactions, getPaymentTransactionById, getTransactionsByOrderId, createPaymentTransaction, updatePaymentTransaction, deletePaymentTransaction };
