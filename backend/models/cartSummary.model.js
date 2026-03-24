/**
 * Lightweight CartSummary model factory.
 * Keeps summary shape consistent across DB and guest/local cart flows.
 */
function createCartSummary(overrides = {}) {
  return {
    itemCount: 0,
    selectedCount: 0,
    totalQuantity: 0,
    subtotal: 0,
    discountTotal: 0,
    shippingFee: 0,
    grandTotal: 0,
    qualifiesForFreeShipping: false,
    amountToFreeShipping: 0,
    ...overrides,
  };
}

module.exports = { createCartSummary };
