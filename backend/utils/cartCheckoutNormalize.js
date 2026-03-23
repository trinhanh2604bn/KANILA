/**
 * Map legacy camelCase request bodies to target snake_case for cart / checkout APIs.
 */

function normalizeCartBody(body = {}) {
  const o = { ...body };
  if (o.cart_status === undefined && o.cartStatus !== undefined) o.cart_status = o.cartStatus;
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  if (o.item_count === undefined && o.itemCount !== undefined) o.item_count = o.itemCount;
  if (o.subtotal_amount === undefined && o.subtotalAmount !== undefined) o.subtotal_amount = o.subtotalAmount;
  if (o.discount_amount === undefined && o.discountAmount !== undefined) o.discount_amount = o.discountAmount;
  if (o.total_amount === undefined && o.totalAmount !== undefined) o.total_amount = o.totalAmount;
  if (o.expires_at === undefined && o.expiresAt !== undefined) o.expires_at = o.expiresAt;
  delete o.cartStatus;
  delete o.currencyCode;
  delete o.itemCount;
  delete o.subtotalAmount;
  delete o.discountAmount;
  delete o.totalAmount;
  delete o.expiresAt;
  delete o.customerId;
  return o;
}

function normalizeCartItemBody(body = {}) {
  const o = { ...body };
  if (o.cart_id === undefined && o.cartId !== undefined) o.cart_id = o.cartId;
  if (o.variant_id === undefined && o.variantId !== undefined) o.variant_id = o.variantId;
  if (o.sku_snapshot === undefined && o.skuSnapshot !== undefined) o.sku_snapshot = o.skuSnapshot;
  if (o.product_name_snapshot === undefined && o.productNameSnapshot !== undefined) {
    o.product_name_snapshot = o.productNameSnapshot;
  }
  if (o.variant_name_snapshot === undefined && o.variantNameSnapshot !== undefined) {
    o.variant_name_snapshot = o.variantNameSnapshot;
  }
  if (o.unit_price_amount === undefined && o.unitPriceAmount !== undefined) o.unit_price_amount = o.unitPriceAmount;
  if (o.discount_amount === undefined && o.discountAmount !== undefined) o.discount_amount = o.discountAmount;
  if (o.final_unit_price_amount === undefined && o.finalUnitPriceAmount !== undefined) {
    o.final_unit_price_amount = o.finalUnitPriceAmount;
  }
  if (o.line_total_amount === undefined && o.lineTotalAmount !== undefined) o.line_total_amount = o.lineTotalAmount;
  if (o.added_at === undefined && o.addedAt !== undefined) o.added_at = o.addedAt;
  delete o.cartId;
  delete o.variantId;
  delete o.skuSnapshot;
  delete o.productNameSnapshot;
  delete o.variantNameSnapshot;
  delete o.unitPriceAmount;
  delete o.finalUnitPriceAmount;
  delete o.lineTotalAmount;
  delete o.addedAt;
  return o;
}

function normalizeCheckoutSessionBody(body = {}) {
  const o = { ...body };
  if (o.cart_id === undefined && o.cartId !== undefined) o.cart_id = o.cartId;
  if (o.checkout_status === undefined && o.checkoutStatus !== undefined) o.checkout_status = o.checkoutStatus;
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  if (o.selected_shipping_address_id === undefined && o.selectedShippingAddressId !== undefined) {
    o.selected_shipping_address_id = o.selectedShippingAddressId;
  }
  if (o.selected_billing_address_id === undefined && o.selectedBillingAddressId !== undefined) {
    o.selected_billing_address_id = o.selectedBillingAddressId;
  }
  if (o.selected_shipping_method_id === undefined && o.selectedShippingMethodId !== undefined) {
    o.selected_shipping_method_id = o.selectedShippingMethodId;
  }
  if (o.selected_payment_method_id === undefined && o.selectedPaymentMethodId !== undefined) {
    o.selected_payment_method_id = o.selectedPaymentMethodId;
  }
  if (o.subtotal_amount === undefined && o.subtotalAmount !== undefined) o.subtotal_amount = o.subtotalAmount;
  if (o.shipping_fee_amount === undefined && o.shippingFeeAmount !== undefined) {
    o.shipping_fee_amount = o.shippingFeeAmount;
  }
  if (o.discount_amount === undefined && o.discountAmount !== undefined) o.discount_amount = o.discountAmount;
  if (o.tax_amount === undefined && o.taxAmount !== undefined) o.tax_amount = o.taxAmount;
  if (o.total_amount === undefined && o.totalAmount !== undefined) o.total_amount = o.totalAmount;
  if (o.expires_at === undefined && o.expiresAt !== undefined) o.expires_at = o.expiresAt;
  delete o.cartId;
  delete o.checkoutStatus;
  delete o.currencyCode;
  delete o.selectedShippingAddressId;
  delete o.selectedBillingAddressId;
  delete o.selectedShippingMethodId;
  delete o.selectedPaymentMethodId;
  delete o.subtotalAmount;
  delete o.shippingFeeAmount;
  delete o.discountAmount;
  delete o.taxAmount;
  delete o.totalAmount;
  delete o.expiresAt;
  delete o.customerId;
  return o;
}

function normalizeCheckoutAddressBody(body = {}) {
  const o = { ...body };
  if (o.checkout_session_id === undefined && o.checkoutSessionId !== undefined) {
    o.checkout_session_id = o.checkoutSessionId;
  }
  if (o.address_type === undefined && o.addressType !== undefined) o.address_type = o.addressType;
  if (o.recipient_name === undefined && o.recipientName !== undefined) o.recipient_name = o.recipientName;
  if (o.address_line_1 === undefined && o.addressLine1 !== undefined) o.address_line_1 = o.addressLine1;
  if (o.address_line_2 === undefined && o.addressLine2 !== undefined) o.address_line_2 = o.addressLine2;
  if (o.country_code === undefined && o.countryCode !== undefined) o.country_code = o.countryCode;
  if (o.postal_code === undefined && o.postalCode !== undefined) o.postal_code = o.postalCode;
  if (o.is_selected === undefined && o.isSelected !== undefined) o.is_selected = o.isSelected;
  delete o.checkoutSessionId;
  delete o.addressType;
  delete o.recipientName;
  delete o.addressLine1;
  delete o.addressLine2;
  delete o.countryCode;
  delete o.postalCode;
  delete o.isSelected;
  return o;
}

function normalizeCheckoutShippingMethodBody(body = {}) {
  const o = { ...body };
  if (o.checkout_session_id === undefined && o.checkoutSessionId !== undefined) {
    o.checkout_session_id = o.checkoutSessionId;
  }
  if (o.shipping_method_id === undefined && o.shippingMethodId !== undefined) {
    o.shipping_method_id = o.shippingMethodId;
  }
  if (o.shipping_method_code === undefined && o.shippingMethodCode !== undefined) {
    o.shipping_method_code = o.shippingMethodCode;
  }
  if (o.carrier_code === undefined && o.carrierCode !== undefined) o.carrier_code = o.carrierCode;
  if (o.service_name === undefined && o.serviceName !== undefined) o.service_name = o.serviceName;
  if (o.estimated_days_min === undefined && o.estimatedDaysMin !== undefined) {
    o.estimated_days_min = o.estimatedDaysMin;
  }
  if (o.estimated_days_max === undefined && o.estimatedDaysMax !== undefined) {
    o.estimated_days_max = o.estimatedDaysMax;
  }
  if (o.shipping_fee_amount === undefined && o.shippingFeeAmount !== undefined) {
    o.shipping_fee_amount = o.shippingFeeAmount;
  }
  if (o.currency_code === undefined && o.currencyCode !== undefined) o.currency_code = o.currencyCode;
  if (o.is_selected === undefined && o.isSelected !== undefined) o.is_selected = o.isSelected;
  delete o.checkoutSessionId;
  delete o.shippingMethodId;
  delete o.shippingMethodCode;
  delete o.carrierCode;
  delete o.serviceName;
  delete o.estimatedDaysMin;
  delete o.estimatedDaysMax;
  delete o.shippingFeeAmount;
  delete o.currencyCode;
  delete o.isSelected;
  return o;
}

function normalizeShippingMethodBody(body = {}) {
  const o = { ...body };
  if (o.shipping_method_code === undefined && o.shippingMethodCode !== undefined) {
    o.shipping_method_code = o.shippingMethodCode;
  }
  if (o.shipping_method_name === undefined && o.shippingMethodName !== undefined) {
    o.shipping_method_name = o.shippingMethodName;
  }
  if (o.carrier_code === undefined && o.carrierCode !== undefined) o.carrier_code = o.carrierCode;
  if (o.service_level === undefined && o.serviceLevel !== undefined) o.service_level = o.serviceLevel;
  if (o.is_active === undefined && o.isActive !== undefined) o.is_active = o.isActive;
  delete o.shippingMethodCode;
  delete o.shippingMethodName;
  delete o.carrierCode;
  delete o.serviceLevel;
  delete o.isActive;
  return o;
}

function normalizePaymentMethodBody(body = {}) {
  const o = { ...body };
  if (o.payment_method_code === undefined && o.paymentMethodCode !== undefined) {
    o.payment_method_code = o.paymentMethodCode;
  }
  if (o.payment_method_name === undefined && o.paymentMethodName !== undefined) {
    o.payment_method_name = o.paymentMethodName;
  }
  if (o.provider_code === undefined && o.providerCode !== undefined) o.provider_code = o.providerCode;
  if (o.method_type === undefined && o.methodType !== undefined) o.method_type = o.methodType;
  if (o.is_active === undefined && o.isActive !== undefined) o.is_active = o.isActive;
  if (o.sort_order === undefined && o.sortOrder !== undefined) o.sort_order = o.sortOrder;
  delete o.paymentMethodCode;
  delete o.paymentMethodName;
  delete o.providerCode;
  delete o.methodType;
  delete o.isActive;
  delete o.sortOrder;
  return o;
}

function normalizeStockReservationBody(body = {}) {
  const o = { ...body };
  if (o.cart_id === undefined && o.cartId !== undefined) o.cart_id = o.cartId;
  if (o.checkout_session_id === undefined && o.checkoutSessionId !== undefined) {
    o.checkout_session_id = o.checkoutSessionId;
  }
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  delete o.cartId;
  delete o.checkoutSessionId;
  delete o.orderId;
  return o;
}

function normalizePaymentIntentBody(body = {}) {
  const o = { ...body };
  if (o.payment_method_id === undefined && o.paymentMethodId !== undefined) {
    o.payment_method_id = o.paymentMethodId;
  }
  if (o.order_id === undefined && o.orderId !== undefined) o.order_id = o.orderId;
  delete o.paymentMethodId;
  delete o.orderId;
  return o;
}

module.exports = {
  normalizeCartBody,
  normalizeCartItemBody,
  normalizeCheckoutSessionBody,
  normalizeCheckoutAddressBody,
  normalizeCheckoutShippingMethodBody,
  normalizeShippingMethodBody,
  normalizePaymentMethodBody,
  normalizeStockReservationBody,
  normalizePaymentIntentBody,
};
