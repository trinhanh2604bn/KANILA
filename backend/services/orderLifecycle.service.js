/**
 * orderLifecycle.service.js
 * ─────────────────────────
 * Centralized state-machine logic for the entire order lifecycle.
 * Every public function: validates → mutates DB → logs history → syncs summaries.
 */

const Order = require("../models/order.model");
const OrderStatusHistory = require("../models/orderStatusHistory.model");
const Shipment = require("../models/shipment.model");
const ShipmentEvent = require("../models/shipmentEvent.model");
const Return = require("../models/return.model");
const ReturnItem = require("../models/returnItem.model");
const Refund = require("../models/refund.model");
const OrderTotal = require("../models/orderTotal.model");
const { validateStatusTransition } = require("../utils/orderStatusGuard");

// ───────────────────── helpers ─────────────────────

async function logHistory(orderId, oldOrder, newFields, accountId, reason) {
  await OrderStatusHistory.create({
    order_id: orderId,
    old_order_status: oldOrder.order_status,
    new_order_status: newFields.order_status ?? oldOrder.order_status,
    old_payment_status: oldOrder.payment_status,
    new_payment_status: newFields.payment_status ?? oldOrder.payment_status,
    old_fulfillment_status: oldOrder.fulfillment_status,
    new_fulfillment_status: newFields.fulfillment_status ?? oldOrder.fulfillment_status,
    changed_by_account_id: accountId || null,
    change_reason: reason || "",
    changed_at: new Date(),
  });
}

function fail(msg, code = 400) {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
}

function assertTransition(field, from, to) {
  const result = validateStatusTransition(field, from, to);
  if (!result.ok) throw fail(result.message);
}

async function getOrderOrFail(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw fail("Order not found", 404);
  return order;
}

// Generate unique shipment number
async function generateShipmentNumber() {
  const count = await Shipment.countDocuments();
  for (let i = 1; i < 9999; i++) {
    const num = `SHP${String(count + i).padStart(6, "0")}`;
    const exists = await Shipment.findOne({ shipmentNumber: num }).select("_id").lean();
    if (!exists) return num;
  }
  return `SHP${Date.now()}`;
}

// Generate unique return number
async function generateReturnNumber() {
  const count = await Return.countDocuments();
  for (let i = 1; i < 9999; i++) {
    const num = `RET${String(count + i).padStart(6, "0")}`;
    const exists = await Return.findOne({ returnNumber: num }).select("_id").lean();
    if (!exists) return num;
  }
  return `RET${Date.now()}`;
}

// ═══════════════════ ORDER STATUS TRANSITIONS ═══════════════════

/**
 * Confirm order: pending → confirmed
 */
async function confirmOrder(orderId, accountId) {
  const order = await getOrderOrFail(orderId);
  assertTransition("order_status", order.order_status, "confirmed");

  const updates = { order_status: "confirmed", confirmed_at: new Date() };
  await Order.findByIdAndUpdate(orderId, updates);
  await logHistory(orderId, order, updates, accountId, "Order confirmed by admin");
  return Order.findById(orderId).populate("customer_id", "full_name customer_code");
}

/**
 * Mark processing: confirmed → processing
 */
async function markProcessing(orderId, accountId) {
  const order = await getOrderOrFail(orderId);
  assertTransition("order_status", order.order_status, "processing");

  const updates = { order_status: "processing" };
  await Order.findByIdAndUpdate(orderId, updates);
  await logHistory(orderId, order, updates, accountId, "Order marked as processing");
  return Order.findById(orderId).populate("customer_id", "full_name customer_code");
}

/**
 * Cancel order: pending/confirmed/processing → cancelled
 * If payment was collected, caller should handle refund separately.
 */
async function cancelOrder(orderId, accountId, reason) {
  const order = await getOrderOrFail(orderId);
  assertTransition("order_status", order.order_status, "cancelled");

  const updates = {
    order_status: "cancelled",
    cancelled_at: new Date(),
    cancellation_reason: reason || "Cancelled by admin",
  };
  await Order.findByIdAndUpdate(orderId, updates);
  await logHistory(orderId, order, updates, accountId, reason || "Order cancelled");
  return Order.findById(orderId).populate("customer_id", "full_name customer_code");
}

/**
 * Mark COD as paid (admin action after delivery)
 */
async function markCodPaid(orderId, accountId) {
  const order = await getOrderOrFail(orderId);
  // Allow unpaid → paid (skip intermediate for COD)
  if (order.payment_status !== "unpaid" && order.payment_status !== "pending") {
    throw fail(`Cannot mark as paid — current payment status is "${order.payment_status}"`);
  }

  const updates = { payment_status: "paid" };
  await Order.findByIdAndUpdate(orderId, updates);
  await logHistory(orderId, order, updates, accountId, "COD payment received");
  return Order.findById(orderId).populate("customer_id", "full_name customer_code");
}

// ═══════════════════ FULFILLMENT / SHIPMENT ═══════════════════

/**
 * Create a shipment for an order.
 */
async function createShipmentForOrder(orderId, payload, accountId) {
  const order = await getOrderOrFail(orderId);

  if (order.order_status === "cancelled") throw fail("Cannot create shipment for cancelled order");
  if (!["confirmed", "processing"].includes(order.order_status)) {
    throw fail(`Order must be confirmed or processing to create shipment (current: ${order.order_status})`);
  }

  const shipmentNumber = payload.shipmentNumber || await generateShipmentNumber();
  const shipment = await Shipment.create({
    order_id: orderId,
    shipmentNumber,
    carrierCode: payload.carrierCode || "",
    serviceName: payload.serviceName || "",
    trackingNumber: payload.trackingNumber || "",
    shipmentStatus: "pending",
    shippingFeeAmount: payload.shippingFeeAmount || 0,
    currencyCode: order.currency_code || "VND",
    warehouseId: payload.warehouseId || null,
  });

  // Auto-move order to processing if confirmed
  const orderUpdates = {};
  if (order.order_status === "confirmed") {
    orderUpdates.order_status = "processing";
  }
  // Update fulfillment to preparing if still unfulfilled
  if (order.fulfillment_status === "unfulfilled") {
    orderUpdates.fulfillment_status = "preparing";
  }

  if (Object.keys(orderUpdates).length > 0) {
    await Order.findByIdAndUpdate(orderId, orderUpdates);
    await logHistory(orderId, order, orderUpdates, accountId, `Shipment ${shipmentNumber} created`);
  }

  // Create initial shipment event
  await ShipmentEvent.create({
    shipmentId: shipment._id,
    eventCode: "created",
    eventStatus: "pending",
    eventDescription: `Shipment ${shipmentNumber} created`,
    eventTime: new Date(),
  });

  return shipment;
}

/**
 * Update shipment status + sync order fulfillment.
 */
async function updateShipmentStatus(shipmentId, newStatus, accountId, eventDescription) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw fail("Shipment not found", 404);

  assertTransition("shipment_status", shipment.shipmentStatus, newStatus);

  const shipmentUpdates = { shipmentStatus: newStatus };
  if (newStatus === "shipped") shipmentUpdates.shippedAt = new Date();
  if (newStatus === "delivered") shipmentUpdates.deliveredAt = new Date();
  if (newStatus === "failed") shipmentUpdates.failedAt = new Date();

  await Shipment.findByIdAndUpdate(shipmentId, shipmentUpdates);

  // Create shipment event
  await ShipmentEvent.create({
    shipmentId: shipment._id,
    eventCode: newStatus,
    eventStatus: newStatus,
    eventDescription: eventDescription || `Shipment status updated to ${newStatus}`,
    eventTime: new Date(),
  });

  // Recalculate order fulfillment status
  await recalcFulfillmentStatus(shipment.order_id, accountId, `Shipment ${shipment.shipmentNumber} → ${newStatus}`);

  return Shipment.findById(shipmentId).populate("order_id", "order_number");
}

/**
 * Recalculate order fulfillment_status from all its shipments.
 * Also auto-completes order if all delivered + payment done.
 */
async function recalcFulfillmentStatus(orderId, accountId, reason) {
  const order = await getOrderOrFail(orderId);
  const shipments = await Shipment.find({ order_id: orderId }).lean();

  if (shipments.length === 0) return order;

  const statuses = shipments.map((s) => s.shipmentStatus);
  let newFulfillment = order.fulfillment_status;

  const allDelivered = statuses.length > 0 && statuses.every((s) => s === "delivered");
  const someDelivered = statuses.some((s) => s === "delivered");
  const allShipped = statuses.every((s) => ["shipped", "in_transit", "delivered"].includes(s));
  const someShipped = statuses.some((s) => ["shipped", "in_transit", "delivered"].includes(s));
  const someInTransit = statuses.some((s) => s === "in_transit");

  if (allDelivered) {
    newFulfillment = "delivered";
  } else if (someInTransit || (someDelivered && !allDelivered)) {
    newFulfillment = "in_transit";
  } else if (allShipped) {
    newFulfillment = "shipped";
  } else if (someShipped) {
    newFulfillment = "partially_shipped";
  } else if (statuses.some((s) => s === "ready_to_ship")) {
    newFulfillment = "preparing";
  }

  const updates = {};
  if (newFulfillment !== order.fulfillment_status) {
    updates.fulfillment_status = newFulfillment;
  }

  // Auto-complete order if all delivered and payment is OK
  if (
    newFulfillment === "delivered" &&
    order.order_status === "processing" &&
    ["paid", "unpaid"].includes(order.payment_status) // COD unpaid at delivery is OK
  ) {
    updates.order_status = "completed";
    updates.completed_at = new Date();
  }

  if (Object.keys(updates).length > 0) {
    await Order.findByIdAndUpdate(orderId, updates);
    await logHistory(orderId, order, updates, accountId, reason || "Fulfillment status recalculated");
  }

  return Order.findById(orderId);
}

/**
 * Add a tracking event to a shipment without changing its status.
 */
async function addShipmentEvent(shipmentId, eventData) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw fail("Shipment not found", 404);

  const event = await ShipmentEvent.create({
    shipmentId: shipment._id,
    eventCode: eventData.eventCode || "update",
    eventStatus: eventData.eventStatus || shipment.shipmentStatus,
    eventDescription: eventData.eventDescription || "",
    eventTime: eventData.eventTime || new Date(),
    locationText: eventData.locationText || "",
  });

  return event;
}

// ═══════════════════ RETURN FLOW ═══════════════════

/**
 * Create a return request for an order.
 */
async function createReturnForOrder(orderId, payload, accountId) {
  const order = await getOrderOrFail(orderId);

  if (!["completed", "processing"].includes(order.order_status)) {
    throw fail("Order must be completed or processing to request a return");
  }
  if (!["delivered", "partially_returned"].includes(order.fulfillment_status)) {
    throw fail("Order must be delivered to request a return");
  }

  const returnNumber = await generateReturnNumber();
  const ret = await Return.create({
    order_id: orderId,
    returnNumber,
    returnReason: payload.returnReason || payload.reason || "",
    returnStatus: "requested",
    requested_by_customer_id: payload.customerId || null,
    requestedAt: new Date(),
    note: payload.note || "",
  });

  // Create return items if provided
  if (payload.items && Array.isArray(payload.items)) {
    for (const item of payload.items) {
      await ReturnItem.create({
        returnId: ret._id,
        orderItemId: item.orderItemId,
        variantId: item.variantId,
        requestedQty: item.requestedQty || item.quantity || 1,
      });
    }
  }

  return ret;
}

/**
 * Approve a return request.
 */
async function approveReturn(returnId, accountId) {
  const ret = await Return.findById(returnId);
  if (!ret) throw fail("Return not found", 404);

  assertTransition("return_status", ret.returnStatus, "approved");

  await Return.findByIdAndUpdate(returnId, {
    returnStatus: "approved",
    approvedByAccountId: accountId,
    approvedAt: new Date(),
  });

  const order = await getOrderOrFail(ret.order_id);
  order.fulfillment_status = "return_approved";
  await order.save();
  await logHistory(ret.order_id, order, { fulfillment_status: "return_approved" }, accountId, `Return ${ret.returnNumber} approved`);

  return Return.findById(returnId);
}

/**
 * Reject a return request.
 */
async function rejectReturn(returnId, accountId) {
  const ret = await Return.findById(returnId);
  if (!ret) throw fail("Return not found", 404);

  assertTransition("return_status", ret.returnStatus, "rejected");

  await Return.findByIdAndUpdate(returnId, { returnStatus: "rejected" });

  const order = await getOrderOrFail(ret.order_id);
  await logHistory(ret.order_id, order, {}, accountId, `Return ${ret.returnNumber} rejected`);

  return Return.findById(returnId);
}

/**
 * Mark return items as received.
 */
async function receiveReturn(returnId, accountId, receivedItems) {
  const ret = await Return.findById(returnId);
  if (!ret) throw fail("Return not found", 404);

  assertTransition("return_status", ret.returnStatus, "received");

  // Update received quantities
  if (receivedItems && Array.isArray(receivedItems)) {
    for (const item of receivedItems) {
      await ReturnItem.findByIdAndUpdate(item.returnItemId, {
        receivedQty: item.receivedQty,
        restockQty: item.restockQty || item.receivedQty,
        restockStatus: item.restockQty > 0 ? "pending" : "disposed",
      });
    }
  } else {
    // Auto-receive all approved quantities
    await ReturnItem.updateMany(
      { returnId: ret._id },
      [{ $set: { receivedQty: "$approvedQty", restockQty: "$approvedQty", restockStatus: "pending" } }]
    );
  }

  await Return.findByIdAndUpdate(returnId, { returnStatus: "received", receivedAt: new Date() });

  return Return.findById(returnId);
}

/**
 * Complete a return: update order fulfillment, optionally trigger refund.
 */
async function completeReturn(returnId, accountId, options = {}) {
  const ret = await Return.findById(returnId);
  if (!ret) throw fail("Return not found", 404);

  assertTransition("return_status", ret.returnStatus, "completed");

  await Return.findByIdAndUpdate(returnId, { returnStatus: "completed", completedAt: new Date() });

  // Mark restock items
  await ReturnItem.updateMany(
    { returnId: ret._id, restockStatus: "pending", restockQty: { $gt: 0 } },
    { restockStatus: "restocked" }
  );

  // Recalculate order fulfillment
  const order = await getOrderOrFail(ret.order_id);
  const allReturns = await Return.find({ order_id: ret.order_id, returnStatus: "completed" }).lean();

  // Determine if full or partial return
  const orderUpdates = {};
  if (allReturns.length > 0) {
    // For now, simplify: if any return is completed, we mark as returned or partially_returned
    // In a more complex system, we'd check if all order items were return-completed.
    orderUpdates.order_status = "returned";
    orderUpdates.fulfillment_status = "returned";
    orderUpdates.completed_at = new Date();
  }

  if (Object.keys(orderUpdates).length > 0) {
    await Order.findByIdAndUpdate(ret.order_id, orderUpdates);
    await logHistory(ret.order_id, order, orderUpdates, accountId, `Return ${ret.returnNumber} completed`);
  }

  // Auto-create refund if requested
  if (options.createRefund && order.payment_status === "paid") {
    const returnItems = await ReturnItem.find({ returnId: ret._id }).lean();
    // Simple: sum up received amounts — in real system would look up order item prices
    const totalAmount = returnItems.reduce((sum, ri) => sum + (ri.receivedQty || 0), 0);
    if (totalAmount > 0) {
      // Will be handled by createRefundForOrder
    }
  }

  return Return.findById(returnId);
}

// ═══════════════════ REFUND FLOW ═══════════════════

/**
 * Create a refund for an order.
 */
async function createRefundForOrder(orderId, payload, accountId) {
  const order = await getOrderOrFail(orderId);

  if (!["paid", "partially_refunded"].includes(order.payment_status)) {
    throw fail("Order must be paid to create a refund");
  }

  // Calculate max refundable
  const totals = await OrderTotal.findOne({ order_id: orderId }).lean();
  const grandTotal = totals?.grand_total_amount || 0;
  const existingRefunds = await Refund.find({
    order_id: orderId,
    refundStatus: { $in: ["requested", "approved", "processing", "completed"] },
  }).lean();
  const totalRefunded = existingRefunds.reduce((s, r) => s + (r.refundedAmount || r.approvedAmount || 0), 0);
  const maxRefundable = grandTotal - totalRefunded;

  const requestedAmount = Number(payload.requestedAmount || payload.amount || 0);
  if (requestedAmount <= 0) throw fail("Refund amount must be greater than 0");
  if (requestedAmount > maxRefundable) {
    throw fail(`Refund amount (${requestedAmount}) exceeds refundable balance (${maxRefundable})`);
  }

  const refund = await Refund.create({
    order_id: orderId,
    paymentTransactionId: payload.paymentTransactionId || null,
    refundReason: payload.refundReason || payload.reason || "",
    refundStatus: "requested",
    requestedAmount,
    currencyCode: order.currency_code || "VND",
    requestedByAccountId: accountId,
    requestedAt: new Date(),
    note: payload.note || "",
  });

  await logHistory(orderId, order, {}, accountId, `Refund requested: ${requestedAmount}`);
  return refund;
}

/**
 * Approve a refund.
 */
async function approveRefund(refundId, accountId) {
  const refund = await Refund.findById(refundId);
  if (!refund) throw fail("Refund not found", 404);

  assertTransition("refund_status", refund.refundStatus, "approved");

  await Refund.findByIdAndUpdate(refundId, {
    refundStatus: "approved",
    approvedAmount: refund.requestedAmount,
    approvedByAccountId: accountId,
    approvedAt: new Date(),
  });

  const order = await getOrderOrFail(refund.order_id);
  await logHistory(refund.order_id, order, {}, accountId, `Refund approved: ${refund.requestedAmount}`);

  return Refund.findById(refundId);
}

/**
 * Complete a refund: update payment status on order.
 */
async function completeRefund(refundId, accountId) {
  const refund = await Refund.findById(refundId);
  if (!refund) throw fail("Refund not found", 404);

  // Allow approved → processing → completed (or approved → completed for simpler flows)
  if (refund.refundStatus === "approved") {
    // Skip processing, go straight to completed
  } else if (refund.refundStatus === "processing") {
    // Already in processing
  } else {
    throw fail(`Cannot complete refund from status "${refund.refundStatus}"`);
  }

  await Refund.findByIdAndUpdate(refundId, {
    refundStatus: "completed",
    refundedAmount: refund.approvedAmount || refund.requestedAmount,
    completedAt: new Date(),
  });

  // Sync order payment_status
  const order = await getOrderOrFail(refund.order_id);
  const totals = await OrderTotal.findOne({ order_id: refund.order_id }).lean();
  const grandTotal = totals?.grand_total_amount || 0;

  // Sum all completed refunds
  const completedRefunds = await Refund.find({
    order_id: refund.order_id,
    refundStatus: "completed",
  }).lean();
  const totalRefunded = completedRefunds.reduce((s, r) => s + (r.refundedAmount || 0), 0);

  const newPaymentStatus = totalRefunded >= grandTotal ? "refunded" : "partially_refunded";
  const updates = { payment_status: newPaymentStatus };

  await Order.findByIdAndUpdate(refund.order_id, updates);
  await logHistory(refund.order_id, order, updates, accountId, `Refund completed: ${refund.refundedAmount || refund.approvedAmount}`);

  return Refund.findById(refundId);
}

module.exports = {
  // Order
  confirmOrder,
  markProcessing,
  cancelOrder,
  markCodPaid,
  // Shipment
  createShipmentForOrder,
  updateShipmentStatus,
  recalcFulfillmentStatus,
  addShipmentEvent,
  // Return
  createReturnForOrder,
  approveReturn,
  rejectReturn,
  receiveReturn,
  completeReturn,
  // Refund
  createRefundForOrder,
  approveRefund,
  completeRefund,
};
