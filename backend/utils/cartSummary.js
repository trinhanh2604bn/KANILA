const { createCartSummary } = require("../models/cartSummary.model");

const FREE_SHIPPING_THRESHOLD = 499000;
const DEFAULT_SHIPPING_FEE = 30000;

function toMoney(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function computeCartSummary(items = [], options = {}) {
  const freeShippingThreshold = toMoney(options.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD);
  const shippingFeeDefault = toMoney(options.shippingFeeDefault ?? DEFAULT_SHIPPING_FEE);

  const itemCount = items.length;
  const selectedItems = items.filter((item) => item?.selected !== false);
  const selectedCount = selectedItems.length;

  const totalQuantity = selectedItems.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + toMoney(item.final_unit_price_amount ?? item.unit_price_amount) * Math.max(0, Number(item.quantity || 0)),
    0
  );
  const discountTotal = selectedItems.reduce(
    (sum, item) => sum + toMoney(item.discount_amount) * Math.max(0, Number(item.quantity || 0)),
    0
  );

  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold && selectedCount > 0;
  const shippingFee = selectedCount === 0 ? 0 : qualifiesForFreeShipping ? 0 : shippingFeeDefault;
  const grandTotal = Math.max(0, subtotal - discountTotal + shippingFee);
  const amountToFreeShipping = qualifiesForFreeShipping ? 0 : Math.max(0, freeShippingThreshold - subtotal);

  return createCartSummary({
    itemCount,
    selectedCount,
    totalQuantity,
    subtotal,
    discountTotal,
    shippingFee,
    grandTotal,
    qualifiesForFreeShipping,
    amountToFreeShipping,
  });
}

module.exports = {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FEE,
  computeCartSummary,
};
