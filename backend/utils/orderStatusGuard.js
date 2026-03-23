/**
 * Validate status transitions for orders (minimal safe rules).
 */

const ORDER_FLOW = ["pending", "confirmed", "processing", "completed"];
const PAYMENT_FLOW = ["unpaid", "authorized", "paid", "partially_refunded", "refunded"];
const FULFILL_FLOW = ["unfulfilled", "partially_fulfilled", "fulfilled", "returned"];

function idx(arr, v) {
  const i = arr.indexOf(v);
  return i === -1 ? -1 : i;
}

function assertEnum(arr, v, label) {
  if (!v) return { ok: true };
  if (!arr.includes(v)) return { ok: false, message: `Invalid ${label}: ${v}` };
  return { ok: true };
}

/**
 * @param {"order_status"|"payment_status"|"fulfillment_status"} field
 * @param {string} from
 * @param {string} to
 */
function validateStatusTransition(field, from, to) {
  if (from === to) return { ok: true };

  if (field === "order_status") {
    const e = assertEnum(ORDER_FLOW.concat(["cancelled"]), to, "order_status");
    if (!e.ok) return e;
    if (from === "cancelled" || from === "completed") {
      return { ok: false, message: "order_status cannot change after completed or cancelled" };
    }
    if (to === "cancelled") return { ok: true };
    const fi = idx(ORDER_FLOW, from);
    const ti = idx(ORDER_FLOW, to);
    if (fi === -1 || ti === -1) return { ok: false, message: "Invalid order_status transition" };
    if (ti !== fi + 1) {
      return { ok: false, message: "order_status must advance one step at a time" };
    }
    return { ok: true };
  }

  if (field === "payment_status") {
    const e = assertEnum(PAYMENT_FLOW, to, "payment_status");
    if (!e.ok) return e;
    if (from === "refunded") return { ok: false, message: "payment_status already refunded" };
    const fi = idx(PAYMENT_FLOW, from);
    const ti = idx(PAYMENT_FLOW, to);
    if (fi === -1 || ti === -1) return { ok: false, message: "Invalid payment_status transition" };
    if (ti !== fi + 1) {
      return { ok: false, message: "payment_status must advance one step at a time" };
    }
    return { ok: true };
  }

  if (field === "fulfillment_status") {
    const e = assertEnum(FULFILL_FLOW, to, "fulfillment_status");
    if (!e.ok) return e;
    if (from === "returned" || from === "fulfilled") {
      if (to !== from) return { ok: false, message: "fulfillment_status is terminal" };
    }
    const fi = idx(FULFILL_FLOW, from);
    const ti = idx(FULFILL_FLOW, to);
    if (fi === -1 || ti === -1) return { ok: false, message: "Invalid fulfillment_status transition" };
    if (ti !== fi + 1) {
      return { ok: false, message: "fulfillment_status must advance one step at a time" };
    }
    return { ok: true };
  }

  return { ok: true };
}

module.exports = { validateStatusTransition, ORDER_FLOW, PAYMENT_FLOW, FULFILL_FLOW };
