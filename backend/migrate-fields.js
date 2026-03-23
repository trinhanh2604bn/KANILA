/**
 * Quick migration: Fix snake_case field names in MongoDB to match Mongoose schemas.
 * Writes output to d:/KANILA/migration-log.txt
 */
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const LOG_FILE = "d:/KANILA/migration-log.txt";
const log = [];
function L(msg) { log.push(msg); fs.writeFileSync(LOG_FILE, log.join("\n")); }

const MONGO_URI = process.env.MONGO_URI;
L("MONGO_URI: " + (MONGO_URI ? MONGO_URI.substring(0, 30) + "..." : "MISSING!"));

async function run() {
  L("Connecting...");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  L("Connected!");

  const db = mongoose.connection.db;
  const renames = {
    /** Legacy camelCase accounts → target snake_case (aligns with account.model.js) */
    accounts: {
      accountType: "account_type",
      accountStatus: "account_status",
      passwordHash: "password_hash",
      emailVerifiedAt: "email_verified_at",
      phoneVerifiedAt: "phone_verified_at",
      lastLoginAt: "last_login_at",
      failedLoginCount: "failed_login_count",
      lockedUntil: "locked_until",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    orders: {
      orderNumber: "order_number",
      customerId: "customer_id",
      currencyCode: "currency_code",
      orderStatus: "order_status",
      paymentStatus: "payment_status",
      fulfillmentStatus: "fulfillment_status",
      customerNote: "customer_note",
      placedAt: "placed_at",
      confirmedAt: "confirmed_at",
      cancelledAt: "cancelled_at",
      cancellationReason: "cancellation_reason",
      checkoutSessionId: "checkout_session_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    order_totals: {
      orderId: "order_id",
      subtotalAmount: "subtotal_amount",
      itemDiscountAmount: "item_discount_amount",
      orderDiscountAmount: "order_discount_amount",
      shippingFeeAmount: "shipping_fee_amount",
      taxAmount: "tax_amount",
      grandTotalAmount: "grand_total_amount",
      refundedAmount: "refunded_amount",
      currencyCode: "currency_code",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    /** Legacy Mongo collection name (no underscores) */
    ordertotals: {
      orderId: "order_id",
      subtotalAmount: "subtotal_amount",
      itemDiscountAmount: "item_discount_amount",
      orderDiscountAmount: "order_discount_amount",
      shippingFeeAmount: "shipping_fee_amount",
      taxAmount: "tax_amount",
      grandTotalAmount: "grand_total_amount",
      refundedAmount: "refunded_amount",
      currencyCode: "currency_code",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    products: {
      product_name: "productName", product_code: "productCode",
      brand_id: "brandId", primary_category_id: "categoryId",
      product_status: "productStatus", short_description: "shortDescription",
      full_description: "longDescription",
      long_description: "longDescription",
      ingredient_text: "ingredientText",
      usage_instruction: "usageInstruction",
      published_at: "publishedAt",
      created_by_account_id: "createdByAccountId",
      updated_by_account_id: "updatedByAccountId",
      created_at: "createdAt", updated_at: "updatedAt",
    },
    brands: {
      brand_name: "brandName", brand_code: "brandCode",
      brand_status: "brandStatus", logo_url: "logoUrl",
      created_at: "createdAt", updated_at: "updatedAt",
    },
    categories: {
      category_name: "categoryName", category_code: "categoryCode",
      category_status: "categoryStatus", parent_category_id: "parentCategoryId",
      display_order: "displayOrder", created_at: "createdAt", updated_at: "updatedAt",
    },
    promotions: {
      promotion_name: "promotionName", promotion_code: "promotionCode",
      promotion_type: "promotionType", discount_type: "discountType",
      discount_value: "discountValue", max_discount_amount: "maxDiscountAmount",
      promotion_status: "promotionStatus", start_at: "startAt", end_at: "endAt",
      usage_limit_total: "usageLimitTotal", usage_limit_per_customer: "usageLimitPerCustomer",
      is_auto_apply: "isAutoApply", stackable_flag: "stackableFlag",
      created_by_account_id: "createdByAccountId",
      created_at: "createdAt", updated_at: "updatedAt",
    },
    coupons: {
      promotion_id: "promotionId", coupon_code: "couponCode",
      coupon_status: "couponStatus", valid_from: "validFrom", valid_to: "validTo",
      usage_limit_total: "usageLimitTotal", usage_limit_per_customer: "usageLimitPerCustomer",
      min_order_amount: "minOrderAmount", created_at: "createdAt", updated_at: "updatedAt",
    },
    /** Legacy `customers` collection → customer_profiles field names */
    customers: {
      accountId: "account_id",
      customerCode: "customer_code",
      firstName: "first_name",
      lastName: "last_name",
      fullName: "full_name",
      dateOfBirth: "date_of_birth",
      avatarUrl: "avatar_url",
      customerStatus: "customer_status",
      registeredAt: "registered_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    /** Legacy `addresses` → customer_addresses */
    addresses: {
      customerId: "customer_id",
      addressLabel: "address_label",
      recipientName: "recipient_name",
      addressLine1: "address_line_1",
      addressLine2: "address_line_2",
      countryCode: "country_code",
      postalCode: "postal_code",
      isDefaultShipping: "is_default_shipping",
      isDefaultBilling: "is_default_billing",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    carts: {
      customerId: "customer_id",
      cartStatus: "cart_status",
      currencyCode: "currency_code",
      itemCount: "item_count",
      subtotalAmount: "subtotal_amount",
      discountAmount: "discount_amount",
      totalAmount: "total_amount",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    cartitems: {
      cartId: "cart_id",
      variantId: "variant_id",
      skuSnapshot: "sku_snapshot",
      productNameSnapshot: "product_name_snapshot",
      variantNameSnapshot: "variant_name_snapshot",
      unitPriceAmount: "unit_price_amount",
      discountAmount: "discount_amount",
      finalUnitPriceAmount: "final_unit_price_amount",
      lineTotalAmount: "line_total_amount",
      addedAt: "added_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    checkoutsessions: {
      cartId: "cart_id",
      customerId: "customer_id",
      checkoutStatus: "checkout_status",
      currencyCode: "currency_code",
      selectedShippingAddressId: "selected_shipping_address_id",
      selectedBillingAddressId: "selected_billing_address_id",
      selectedShippingMethodId: "selected_shipping_method_id",
      selectedPaymentMethodId: "selected_payment_method_id",
      subtotalAmount: "subtotal_amount",
      shippingFeeAmount: "shipping_fee_amount",
      discountAmount: "discount_amount",
      taxAmount: "tax_amount",
      totalAmount: "total_amount",
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    checkoutaddresses: {
      checkoutSessionId: "checkout_session_id",
      addressType: "address_type",
      recipientName: "recipient_name",
      addressLine1: "address_line_1",
      addressLine2: "address_line_2",
      countryCode: "country_code",
      postalCode: "postal_code",
      isSelected: "is_selected",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    checkoutshippingmethods: {
      checkoutSessionId: "checkout_session_id",
      shippingMethodId: "shipping_method_id",
      shippingMethodCode: "shipping_method_code",
      carrierCode: "carrier_code",
      serviceName: "service_name",
      estimatedDaysMin: "estimated_days_min",
      estimatedDaysMax: "estimated_days_max",
      shippingFeeAmount: "shipping_fee_amount",
      currencyCode: "currency_code",
      isSelected: "is_selected",
      createdAt: "created_at",
    },
    shippingmethods: {
      shippingMethodCode: "shipping_method_code",
      shippingMethodName: "shipping_method_name",
      carrierCode: "carrier_code",
      serviceLevel: "service_level",
      isActive: "is_active",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    paymentmethods: {
      paymentMethodCode: "payment_method_code",
      paymentMethodName: "payment_method_name",
      providerCode: "provider_code",
      methodType: "method_type",
      isActive: "is_active",
      sortOrder: "sort_order",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    paymentintents: {
      paymentMethodId: "payment_method_id",
      orderId: "order_id",
    },
    stockreservations: {
      cartId: "cart_id",
      checkoutSessionId: "checkout_session_id",
      orderId: "order_id",
    },
    shipments: {
      orderId: "order_id",
    },
    refunds: {
      orderId: "order_id",
    },
    paymenttransactions: {
      orderId: "order_id",
    },
    wishlists: { customerId: "customer_id" },
    loyaltyaccounts: { customerId: "customer_id" },
    couponredemptions: { customerId: "customer_id", orderId: "order_id" },
    loyaltypointledgers: { customerId: "customer_id", orderId: "order_id" },
    reviews: { customerId: "customer_id" },
    reviewvotes: { customerId: "customer_id" },
    returns: { requestedByCustomerId: "requested_by_customer_id", orderId: "order_id" },
    order_items: {
      orderId: "order_id",
      productId: "product_id",
      variantId: "variant_id",
      skuSnapshot: "sku_snapshot",
      productNameSnapshot: "product_name_snapshot",
      variantNameSnapshot: "variant_name_snapshot",
      unitListPriceAmount: "unit_list_price_amount",
      unitSalePriceAmount: "unit_sale_price_amount",
      unitFinalPriceAmount: "unit_final_price_amount",
      lineSubtotalAmount: "line_subtotal_amount",
      lineDiscountAmount: "line_discount_amount",
      lineTotalAmount: "line_total_amount",
      currencyCode: "currency_code",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    orderitems: {
      orderId: "order_id",
      productId: "product_id",
      variantId: "variant_id",
      skuSnapshot: "sku_snapshot",
      productNameSnapshot: "product_name_snapshot",
      variantNameSnapshot: "variant_name_snapshot",
      unitListPriceAmount: "unit_list_price_amount",
      unitSalePriceAmount: "unit_sale_price_amount",
      unitFinalPriceAmount: "unit_final_price_amount",
      lineSubtotalAmount: "line_subtotal_amount",
      lineDiscountAmount: "line_discount_amount",
      lineTotalAmount: "line_total_amount",
      currencyCode: "currency_code",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    order_addresses: {
      orderId: "order_id",
      addressType: "address_type",
      recipientName: "recipient_name",
      addressLine1: "address_line_1",
      addressLine2: "address_line_2",
      countryCode: "country_code",
      postalCode: "postal_code",
      createdAt: "created_at",
    },
    order_status_history: {
      orderId: "order_id",
      oldOrderStatus: "old_order_status",
      newOrderStatus: "new_order_status",
      oldPaymentStatus: "old_payment_status",
      newPaymentStatus: "new_payment_status",
      oldFulfillmentStatus: "old_fulfillment_status",
      newFulfillmentStatus: "new_fulfillment_status",
      changedByAccountId: "changed_by_account_id",
      changeReason: "change_reason",
      changedAt: "changed_at",
    },
  };

  for (const [colName, fields] of Object.entries(renames)) {
    L("\n--- " + colName + " ---");
    const col = db.collection(colName);
    const count = await col.countDocuments();
    L("  Documents: " + count);
    for (const [oldName, newName] of Object.entries(fields)) {
      const r = await col.updateMany({ [oldName]: { $exists: true } }, { $rename: { [oldName]: newName } });
      if (r.modifiedCount > 0) L("  " + oldName + " -> " + newName + ": " + r.modifiedCount);
    }
  }

  // Add default price to products missing it
  const prodCol = db.collection("products");
  const noPriceRes = await prodCol.updateMany({ price: { $exists: false } }, { $set: { price: 0 } });
  if (noPriceRes.modifiedCount > 0) L("\nSet default price=0: " + noPriceRes.modifiedCount + " products");

  // Verify
  L("\n=== VERIFICATION ===");
  const order = await db.collection("orders").findOne();
  if (order) L("Order keys: " + Object.keys(order).join(", "));
  const total = await db.collection("order_totals").findOne();
  if (total) L("Total keys: " + Object.keys(total).join(", "));

  L("\n=== MIGRATION COMPLETE ===");
  await mongoose.disconnect();
}

run().catch(err => {
  L("ERROR: " + err.message);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
