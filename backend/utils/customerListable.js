/**
 * Customers with no name, email (from account), or code should not appear in admin lists.
 * Name includes full_name or first_name + last_name.
 */
function isCustomerListable(doc) {
  const fromParts = [doc.first_name, doc.last_name].filter(Boolean).join(" ").trim();
  const name = (doc.full_name || "").trim() || fromParts;
  const acc = doc.account_id && typeof doc.account_id === "object" ? doc.account_id : null;
  const email = acc && acc.email ? String(acc.email).trim() : "";
  const code = (doc.customer_code || "").trim();
  return !!(name || email || code);
}

module.exports = { isCustomerListable };
