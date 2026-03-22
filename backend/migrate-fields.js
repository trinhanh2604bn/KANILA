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
    orders: {
      customer_id: "customerId", order_number: "orderNumber",
      order_status: "orderStatus", payment_status: "paymentStatus",
      fulfillment_status: "fulfillmentStatus", customer_note: "customerNote",
      placed_at: "placedAt", confirmed_at: "confirmedAt",
      cancelled_at: "cancelledAt", cancellation_reason: "cancellationReason",
      checkout_session_id: "checkoutSessionId", currency_code: "currencyCode",
      created_at: "createdAt", updated_at: "updatedAt",
    },
    ordertotals: {
      order_id: "orderId", subtotal_amount: "subtotalAmount",
      item_discount_amount: "itemDiscountAmount", order_discount_amount: "orderDiscountAmount",
      shipping_fee_amount: "shippingFeeAmount", tax_amount: "taxAmount",
      grand_total_amount: "grandTotalAmount", refunded_amount: "refundedAmount",
      currency_code: "currencyCode", created_at: "createdAt", updated_at: "updatedAt",
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
    customers: {
      account_id: "accountId", customer_code: "customerCode",
      full_name: "fullName", first_name: "firstName", last_name: "lastName",
      date_of_birth: "dateOfBirth", avatar_url: "avatarUrl",
      customer_status: "customerStatus", registered_at: "registeredAt",
      created_at: "createdAt", updated_at: "updatedAt",
    },
    orderitems: {
      order_id: "orderId", product_id: "productId", variant_id: "variantId",
      product_name_snapshot: "productNameSnapshot", sku_snapshot: "skuSnapshot",
      unit_list_price_amount: "unitListPriceAmount", unit_final_price_amount: "unitFinalPriceAmount",
      line_total_amount: "lineTotalAmount", created_at: "createdAt", updated_at: "updatedAt",
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
  const total = await db.collection("ordertotals").findOne();
  if (total) L("Total keys: " + Object.keys(total).join(", "));

  L("\n=== MIGRATION COMPLETE ===");
  await mongoose.disconnect();
}

run().catch(err => {
  L("ERROR: " + err.message);
  mongoose.disconnect().catch(() => {});
  process.exit(1);
});
