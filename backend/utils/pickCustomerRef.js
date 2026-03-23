/**
 * Normalize customer id from request bodies (snake_case target; camelCase legacy).
 */
function pickCustomerId(body) {
  if (!body || typeof body !== "object") return undefined;
  return body.customer_id ?? body.customerId;
}

function pickCustomerIdParam(req) {
  return req.params.customer_id ?? req.params.customerId;
}

module.exports = { pickCustomerId, pickCustomerIdParam };
