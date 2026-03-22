/**
 * One-time migration to fix snake_case field names in MongoDB collections.
 * Call via GET /api/migrate-fields (one-time use, remove after running).
 */
const express = require("express");
const router = express.Router();

router.get("/seed-admin", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const bcrypt = require("bcryptjs");
    const Account = require("../models/account.model");

    const email = "admin@gmail.com";
    const password = "admin1234";

    let account = await Account.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (account) {
      account.passwordHash = passwordHash;
      account.accountType = "admin";
      account.accountStatus = "active";
      await account.save();
      res.json({ success: true, message: "Admin account updated" });
    } else {
      account = await Account.create({
        email,
        passwordHash,
        accountType: "admin",
        accountStatus: "active",
        username: "Kanila Admin",
      });
      res.json({ success: true, message: "Admin account created" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const db = mongoose.connection.db;
    const results = [];

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
      const col = db.collection(colName);
      const count = await col.countDocuments();
      const colResults = { collection: colName, documents: count, renamed: [] };
      for (const [oldName, newName] of Object.entries(fields)) {
        const r = await col.updateMany({ [oldName]: { $exists: true } }, { $rename: { [oldName]: newName } });
        if (r.modifiedCount > 0) colResults.renamed.push({ from: oldName, to: newName, count: r.modifiedCount });
      }
      results.push(colResults);
    }

    // Set default price for products missing it
    const prodCol = db.collection("products");
    const noPriceRes = await prodCol.updateMany({ price: { $exists: false } }, { $set: { price: 0 } });

    res.json({
      success: true,
      message: "Migration completed",
      defaultPriceSet: noPriceRes.modifiedCount,
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
