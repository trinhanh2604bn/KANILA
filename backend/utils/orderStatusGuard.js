/**
 * Validate status transitions using adjacency maps.
 * Each status maps to an array of allowed next statuses.
 */

const ORDER_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed:  ["returned"],          // only via return flow
  cancelled:  [],                    // terminal
  returned:   [],                    // terminal
};

const PAYMENT_TRANSITIONS = {
  unpaid:              ["pending", "authorized", "paid"],
  pending:             ["authorized", "paid", "failed"],
  authorized:          ["paid", "failed"],
  paid:                ["partially_refunded", "refunded"],
  failed:              ["pending"],             // retry
  partially_refunded:  ["refunded"],
  refunded:            [],                      // terminal
};

const FULFILLMENT_TRANSITIONS = {
  unfulfilled:        ["preparing"],
  preparing:          ["partially_shipped", "shipped"],
  partially_shipped:  ["shipped"],
  shipped:            ["in_transit", "delivered"],
  in_transit:         ["delivered"],
  delivered:          ["partially_returned", "returned"],
  partially_returned: ["returned"],
  returned:           [],                       // terminal
};

const SHIPMENT_TRANSITIONS = {
  pending:       ["ready_to_ship", "failed"],
  ready_to_ship: ["shipped", "failed"],
  shipped:       ["in_transit", "delivered", "failed"],
  in_transit:    ["delivered", "failed"],
  delivered:     ["returned"],
  failed:        ["pending"],                   // retry
  returned:      [],
};

const RETURN_TRANSITIONS = {
  requested: ["approved", "rejected"],
  approved:  ["received"],
  received:  ["completed"],
  completed: [],
  rejected:  [],
};

const REFUND_TRANSITIONS = {
  requested:  ["approved", "rejected"],
  approved:   ["processing"],
  processing: ["completed"],
  completed:  [],
  rejected:   [],
};

const TRANSITION_MAPS = {
  order_status:      ORDER_TRANSITIONS,
  payment_status:    PAYMENT_TRANSITIONS,
  fulfillment_status: FULFILLMENT_TRANSITIONS,
  shipment_status:   SHIPMENT_TRANSITIONS,
  return_status:     RETURN_TRANSITIONS,
  refund_status:     REFUND_TRANSITIONS,
};

/**
 * Validate a status transition.
 * @param {string} field — one of order_status, payment_status, fulfillment_status, shipment_status, return_status, refund_status
 * @param {string} from  — current status
 * @param {string} to    — requested new status
 * @returns {{ ok: boolean, message?: string }}
 */
function validateStatusTransition(field, from, to) {
  if (from === to) return { ok: true };

  const map = TRANSITION_MAPS[field];
  if (!map) return { ok: true }; // unknown field — allow

  const allowed = map[from];
  if (!allowed) return { ok: false, message: `Unknown ${field} value: "${from}"` };

  if (!allowed.includes(to)) {
    const validValues = Object.keys(map);
    if (!validValues.includes(to)) {
      return { ok: false, message: `Invalid ${field} value: "${to}"` };
    }
    return {
      ok: false,
      message: `Cannot transition ${field} from "${from}" to "${to}". Allowed: [${allowed.join(", ")}]`,
    };
  }

  return { ok: true };
}

// Legacy exports for compatibility
const ORDER_FLOW = Object.keys(ORDER_TRANSITIONS);
const PAYMENT_FLOW = Object.keys(PAYMENT_TRANSITIONS);
const FULFILL_FLOW = Object.keys(FULFILLMENT_TRANSITIONS);

module.exports = {
  validateStatusTransition,
  TRANSITION_MAPS,
  ORDER_TRANSITIONS,
  PAYMENT_TRANSITIONS,
  FULFILLMENT_TRANSITIONS,
  SHIPMENT_TRANSITIONS,
  RETURN_TRANSITIONS,
  REFUND_TRANSITIONS,
  // Legacy
  ORDER_FLOW,
  PAYMENT_FLOW,
  FULFILL_FLOW,
};
