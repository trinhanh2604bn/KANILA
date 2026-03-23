/**
 * Map legacy camelCase bodies to snake_case for order domain models.
 */

function normalizeOrderBody(body = {}) {
  const o = { ...body };
  if (o.order_number === undefined && o.orderNumber !== undefined) o.order_number = o.orderNumber;
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  if (o.order_status === undefined && o.orderStatus !== undefined) o.order_status = o.orderStatus;
  if (o.payment_status === undefined && o.paymentStatus !== undefined) o.payment_status = o.paymentStatus;
  if (o.fulfillment_status === undefined && o.fulfillmentStatus !== undefined) {
    o.fulfillment_status = o.fulfillmentStatus;
  }
  if (o.customer_note === undefined && o.customerNote !== undefined) o.customer_note = o.customerNote;
  if (o.placed_at === undefined && o.placedAt !== undefined) o.placed_at = o.placedAt;
  if (o.confirmed_at === undefined && o.confirmedAt !== undefined) o.confirmed_at = o.confirmedAt;
  if (o.cancelled_at === undefined && o.cancelledAt !== undefined) o.cancelled_at = o.cancelledAt;
  if (o.cancellation_reason === undefined && o.cancellationReason !== undefined) {
    o.cancellation_reason = o.cancellationReason;
  }
  if (o.checkout_session_id === undefined && o.checkoutSessionId !== undefined) {
    o.checkout_session_id = o.checkoutSessionId;
  }
  if (o.customer_id === undefined && o.customerId !== undefined) o.customer_id = o.customerId;
  delete o.orderNumber;
  delete o.currencyCode;
  delete o.orderStatus;
  delete o.paymentStatus;
  delete o.fulfillmentStatus;
  delete o.customerNote;
  delete o.placedAt;
  delete o.confirmedAt;
  delete o.cancelledAt;
  delete o.cancellationReason;
  delete o.checkoutSessionId;
  delete o.customerId;
  return o;
}

function normalizeOrderItemBody(body = {}) {
  const o = { ...body };
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  if (o.product_id === undefined && o.productId !== undefined) o.product_id = o.productId;
  if (o.variant_id === undefined && o.variantId !== undefined) o.variant_id = o.variantId;
  if (o.sku_snapshot === undefined && o.skuSnapshot !== undefined) o.sku_snapshot = o.skuSnapshot;
  if (o.product_name_snapshot === undefined && o.productNameSnapshot !== undefined) {
    o.product_name_snapshot = o.productNameSnapshot;
  }
  if (o.variant_name_snapshot === undefined && o.variantNameSnapshot !== undefined) {
    o.variant_name_snapshot = o.variantNameSnapshot;
  }
  if (o.unit_list_price_amount === undefined && o.unitListPriceAmount !== undefined) {
    o.unit_list_price_amount = o.unitListPriceAmount;
  }
  if (o.unit_sale_price_amount === undefined && o.unitSalePriceAmount !== undefined) {
    o.unit_sale_price_amount = o.unitSalePriceAmount;
  }
  if (o.unit_final_price_amount === undefined && o.unitFinalPriceAmount !== undefined) {
    o.unit_final_price_amount = o.unitFinalPriceAmount;
  }
  if (o.line_subtotal_amount === undefined && o.lineSubtotalAmount !== undefined) {
    o.line_subtotal_amount = o.lineSubtotalAmount;
  }
  if (o.line_discount_amount === undefined && o.lineDiscountAmount !== undefined) {
    o.line_discount_amount = o.lineDiscountAmount;
  }
  if (o.line_total_amount === undefined && o.lineTotalAmount !== undefined) {
    o.line_total_amount = o.lineTotalAmount;
  }
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  delete o.orderId;
  delete o.productId;
  delete o.variantId;
  delete o.skuSnapshot;
  delete o.productNameSnapshot;
  delete o.variantNameSnapshot;
  delete o.unitListPriceAmount;
  delete o.unitSalePriceAmount;
  delete o.unitFinalPriceAmount;
  delete o.lineSubtotalAmount;
  delete o.lineDiscountAmount;
  delete o.lineTotalAmount;
  delete o.currencyCode;
  return o;
}

function normalizeOrderTotalBody(body = {}) {
  const o = { ...body };
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  if (o.subtotal_amount === undefined && o.subtotalAmount !== undefined) o.subtotal_amount = o.subtotalAmount;
  if (o.item_discount_amount === undefined && o.itemDiscountAmount !== undefined) {
    o.item_discount_amount = o.itemDiscountAmount;
  }
  if (o.order_discount_amount === undefined && o.orderDiscountAmount !== undefined) {
    o.order_discount_amount = o.orderDiscountAmount;
  }
  if (o.shipping_fee_amount === undefined && o.shippingFeeAmount !== undefined) {
    o.shipping_fee_amount = o.shippingFeeAmount;
  }
  if (o.tax_amount === undefined && o.taxAmount !== undefined) o.tax_amount = o.taxAmount;
  if (o.grand_total_amount === undefined && o.grandTotalAmount !== undefined) {
    o.grand_total_amount = o.grandTotalAmount;
  }
  if (o.refunded_amount === undefined && o.refundedAmount !== undefined) o.refunded_amount = o.refundedAmount;
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  delete o.orderId;
  delete o.subtotalAmount;
  delete o.itemDiscountAmount;
  delete o.orderDiscountAmount;
  delete o.shippingFeeAmount;
  delete o.taxAmount;
  delete o.grandTotalAmount;
  delete o.refundedAmount;
  delete o.currencyCode;
  return o;
}

function normalizeOrderAddressBody(body = {}) {
  const o = { ...body };
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  if (o.address_type === undefined && o.addressType !== undefined) o.address_type = o.addressType;
  if (o.recipient_name === undefined && o.recipientName !== undefined) o.recipient_name = o.recipientName;
  if (o.address_line_1 === undefined && o.addressLine1 !== undefined) o.address_line_1 = o.addressLine1;
  if (o.address_line_2 === undefined && o.addressLine2 !== undefined) o.address_line_2 = o.addressLine2;
  if (o.country_code === undefined && o.countryCode !== undefined) o.country_code = o.countryCode;
  if (o.postal_code === undefined && o.postalCode !== undefined) o.postal_code = o.postalCode;
  delete o.orderId;
  delete o.addressType;
  delete o.recipientName;
  delete o.addressLine1;
  delete o.addressLine2;
  delete o.countryCode;
  delete o.postalCode;
  return o;
}

function normalizeOrderStatusHistoryBody(body = {}) {
  const o = { ...body };
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  if (o.old_order_status === undefined && o.oldOrderStatus !== undefined) o.old_order_status = o.oldOrderStatus;
  if (o.new_order_status === undefined && o.newOrderStatus !== undefined) o.new_order_status = o.newOrderStatus;
  if (o.old_payment_status === undefined && o.oldPaymentStatus !== undefined) {
    o.old_payment_status = o.oldPaymentStatus;
  }
  if (o.new_payment_status === undefined && o.newPaymentStatus !== undefined) {
    o.new_payment_status = o.newPaymentStatus;
  }
  if (o.old_fulfillment_status === undefined && o.oldFulfillmentStatus !== undefined) {
    o.old_fulfillment_status = o.oldFulfillmentStatus;
  }
  if (o.new_fulfillment_status === undefined && o.newFulfillmentStatus !== undefined) {
    o.new_fulfillment_status = o.newFulfillmentStatus;
  }
  if (o.changed_by_account_id === undefined && o.changedByAccountId !== undefined) {
    o.changed_by_account_id = o.changedByAccountId;
  }
  if (o.change_reason === undefined && o.changeReason !== undefined) o.change_reason = o.changeReason;
  if (o.changed_at === undefined && o.changedAt !== undefined) o.changed_at = o.changedAt;
  delete o.orderId;
  delete o.oldOrderStatus;
  delete o.newOrderStatus;
  delete o.oldPaymentStatus;
  delete o.newPaymentStatus;
  delete o.oldFulfillmentStatus;
  delete o.newFulfillmentStatus;
  delete o.changedByAccountId;
  delete o.changeReason;
  delete o.changedAt;
  return o;
}

/** Any payload that references an order by legacy `orderId`. */
function normalizeOrderFk(body = {}) {
  const o = { ...body };
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  delete o.orderId;
  return o;
}

module.exports = {
  normalizeOrderBody,
  normalizeOrderItemBody,
  normalizeOrderTotalBody,
  normalizeOrderAddressBody,
  normalizeOrderStatusHistoryBody,
  normalizeOrderFk,
};
