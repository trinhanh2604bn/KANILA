/**
 * adminOperations.controller.js
 * ─────────────────────────────
 * Thin HTTP wrappers for the orderLifecycle service.
 * All business logic lives in services/orderLifecycle.service.js.
 */

const lifecycle = require("../services/orderLifecycle.service");
const validateObjectId = require("../utils/validateObjectId");

function getAccountId(req) {
  return req.user?.account_id || req.user?.accountId || null;
}

function handleServiceError(res, error) {
  const code = error.statusCode || 500;
  return res.status(code).json({ success: false, message: error.message });
}

// ─── ORDER STATUS ──────────────────────────────────

const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await lifecycle.confirmOrder(id, getAccountId(req));
    res.json({ success: true, message: "Order confirmed", data: order });
  } catch (e) { handleServiceError(res, e); }
};

const markProcessing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await lifecycle.markProcessing(id, getAccountId(req));
    res.json({ success: true, message: "Order marked as processing", data: order });
  } catch (e) { handleServiceError(res, e); }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const reason = req.body.reason || req.body.cancellation_reason || "";
    const order = await lifecycle.cancelOrder(id, getAccountId(req), reason);
    res.json({ success: true, message: "Order cancelled", data: order });
  } catch (e) { handleServiceError(res, e); }
};

const markCodPaid = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const order = await lifecycle.markCodPaid(id, getAccountId(req));
    res.json({ success: true, message: "COD payment recorded", data: order });
  } catch (e) { handleServiceError(res, e); }
};

// ─── SHIPMENT ──────────────────────────────────────

const createShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const shipment = await lifecycle.createShipmentForOrder(id, req.body, getAccountId(req));
    res.status(201).json({ success: true, message: "Shipment created", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const shipmentReadyToShip = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const shipment = await lifecycle.updateShipmentStatus(id, "ready_to_ship", getAccountId(req), "Shipment is ready to ship");
    res.json({ success: true, message: "Shipment ready to ship", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const shipShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const shipment = await lifecycle.updateShipmentStatus(id, "shipped", getAccountId(req), "Shipment has been shipped");
    res.json({ success: true, message: "Shipment shipped", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const shipmentInTransit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const shipment = await lifecycle.updateShipmentStatus(id, "in_transit", getAccountId(req), "Shipment is in transit");
    res.json({ success: true, message: "Shipment in transit", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const deliverShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const shipment = await lifecycle.updateShipmentStatus(id, "delivered", getAccountId(req), "Shipment delivered successfully");
    res.json({ success: true, message: "Shipment delivered", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const failShipment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const reason = req.body.reason || "Delivery failed";
    const shipment = await lifecycle.updateShipmentStatus(id, "failed", getAccountId(req), reason);
    res.json({ success: true, message: "Shipment marked as failed", data: shipment });
  } catch (e) { handleServiceError(res, e); }
};

const addShipmentEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid shipment ID" });
    const event = await lifecycle.addShipmentEvent(id, req.body);
    res.status(201).json({ success: true, message: "Shipment event added", data: event });
  } catch (e) { handleServiceError(res, e); }
};

// ─── RETURN ────────────────────────────────────────

const createReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const ret = await lifecycle.createReturnForOrder(id, req.body, getAccountId(req));
    res.status(201).json({ success: true, message: "Return request created", data: ret });
  } catch (e) { handleServiceError(res, e); }
};

const approveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid return ID" });
    const ret = await lifecycle.approveReturn(id, getAccountId(req));
    res.json({ success: true, message: "Return approved", data: ret });
  } catch (e) { handleServiceError(res, e); }
};

const rejectReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid return ID" });
    const ret = await lifecycle.rejectReturn(id, getAccountId(req));
    res.json({ success: true, message: "Return rejected", data: ret });
  } catch (e) { handleServiceError(res, e); }
};

const receiveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid return ID" });
    const ret = await lifecycle.receiveReturn(id, getAccountId(req), req.body.items);
    res.json({ success: true, message: "Return items received", data: ret });
  } catch (e) { handleServiceError(res, e); }
};

const completeReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid return ID" });
    const ret = await lifecycle.completeReturn(id, getAccountId(req), req.body);
    res.json({ success: true, message: "Return completed", data: ret });
  } catch (e) { handleServiceError(res, e); }
};

// ─── REFUND ────────────────────────────────────────

const createRefund = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const refund = await lifecycle.createRefundForOrder(id, req.body, getAccountId(req));
    res.status(201).json({ success: true, message: "Refund created", data: refund });
  } catch (e) { handleServiceError(res, e); }
};

const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid refund ID" });
    const refund = await lifecycle.approveRefund(id, getAccountId(req));
    res.json({ success: true, message: "Refund approved", data: refund });
  } catch (e) { handleServiceError(res, e); }
};

const completeRefund = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid refund ID" });
    const refund = await lifecycle.completeRefund(id, getAccountId(req));
    res.json({ success: true, message: "Refund completed", data: refund });
  } catch (e) { handleServiceError(res, e); }
};

module.exports = {
  confirmOrder,
  markProcessing,
  cancelOrder,
  markCodPaid,
  createShipment,
  shipmentReadyToShip,
  shipShipment,
  shipmentInTransit,
  deliverShipment,
  failShipment,
  addShipmentEvent,
  createReturn,
  approveReturn,
  rejectReturn,
  receiveReturn,
  completeReturn,
  createRefund,
  approveRefund,
  completeRefund,
};
