/**
 * Normalize request bodies that may use camelCase (legacy admin) or snake_case (target schema).
 */
function pickAccountType(body) {
  return body.account_type ?? body.accountType;
}

function pickAccountStatus(body) {
  return body.account_status ?? body.accountStatus;
}

function pickEmailVerifiedAt(body) {
  return body.email_verified_at ?? body.emailVerifiedAt;
}

module.exports = {
  pickAccountType,
  pickAccountStatus,
  pickEmailVerifiedAt,
};
