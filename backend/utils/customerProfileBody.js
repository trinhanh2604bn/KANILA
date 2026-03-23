/**
 * Map request bodies to customer_profiles snake_case (accept legacy camelCase).
 */
function normalizeCustomerWrite(body) {
  const o = {};
  if (body.first_name !== undefined || body.firstName !== undefined) {
    o.first_name = body.first_name ?? body.firstName ?? "";
  }
  if (body.last_name !== undefined || body.lastName !== undefined) {
    o.last_name = body.last_name ?? body.lastName ?? "";
  }
  if (body.full_name !== undefined || body.fullName !== undefined) {
    o.full_name = body.full_name ?? body.fullName;
  }
  if (body.date_of_birth !== undefined || body.dateOfBirth !== undefined) {
    o.date_of_birth = body.date_of_birth ?? body.dateOfBirth;
  }
  if (body.gender !== undefined) o.gender = body.gender;
  if (body.avatar_url !== undefined || body.avatarUrl !== undefined) {
    o.avatar_url = body.avatar_url ?? body.avatarUrl ?? "";
  }
  if (body.customer_status !== undefined || body.customerStatus !== undefined) {
    o.customer_status = body.customer_status ?? body.customerStatus;
  }
  if (body.registered_at !== undefined || body.registeredAt !== undefined) {
    o.registered_at = body.registered_at ?? body.registeredAt;
  }
  return o;
}

module.exports = { normalizeCustomerWrite };
