/**
 * Customers with no name, email (from account), or code should not appear in admin lists.
 * Name includes fullName or firstName + lastName.
 */
function isCustomerListable(doc) {
  const fromParts = [doc.firstName, doc.lastName].filter(Boolean).join(" ").trim();
  const name = (doc.fullName || "").trim() || fromParts;
  const email =
    doc.accountId && typeof doc.accountId === "object" && doc.accountId.email
      ? String(doc.accountId.email).trim()
      : "";
  const code = (doc.customerCode || "").trim();
  return !!(name || email || code);
}

module.exports = { isCustomerListable };
