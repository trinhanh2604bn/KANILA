/**
 * Seed realistic sample data for:
 * - InventoryBalance (20)
 * - PaymentTransaction (20) (+ matching PaymentIntent support rows)
 * - Return (10) linked to Customer (and Order)
 *
 * Usage:
 *   node scripts/seed-inventory-payment-return.js
 * Optional env:
 *   RESET=1            Reset related collections before inserting (default: 1)
 *   TARGET_RETURNS=10  How many Return records to insert (default: 10)
 */

require("dotenv").config();
const mongoose = require("mongoose");

const InventoryBalance = require("../models/inventoryBalance.model");
const ProductVariant = require("../models/productVariant.model");
const Product = require("../models/product.model");
const Warehouse = require("../models/warehouse.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderTotal = require("../models/orderTotal.model");
const PaymentIntent = require("../models/paymentIntent.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const PaymentMethod = require("../models/paymentMethod.model");
const Return = require("../models/return.model");
const ReturnItem = require("../models/returnItem.model");

const TARGET_INVENTORY = 20;
const TARGET_PAYMENTS = 20;
const TARGET_RETURNS = Number(process.env.TARGET_RETURNS || 10);
const RESET = process.env.RESET === undefined ? true : process.env.RESET === "1";

function roundAmount(n) {
  const v = Number(n) || 0;
  return Math.round(v);
}

function chooseMix(i, total) {
  // Deterministic stock state mix:
  // - first 8: high stock
  // - next 7: low stock
  // - remaining: out of stock (available = 0)
  if (i < 8) return "high";
  if (i < 15) return "low";
  return "out";
}

async function ensureProductVariants({ needed, products, orderItems }) {
  // Reuse existing variants if present by SKU; otherwise create from order item snapshots.
  const bySku = new Map();
  for (const it of orderItems) {
    const sku = String(it.sku_snapshot || "").trim().toUpperCase();
    if (!sku) continue;
    if (!bySku.has(sku)) {
      bySku.set(sku, { sku, variant_name_snapshot: it.variant_name_snapshot });
    }
    if (bySku.size >= needed) break;
  }

  if (bySku.size < needed) {
    throw new Error(
      `Not enough distinct sku_snapshot values to create ${needed} ProductVariant rows (found ${bySku.size}).`
    );
  }

  const createdIds = [];
  let idx = 0;
  for (const { sku, variant_name_snapshot } of bySku.values()) {
    const existing = await ProductVariant.findOne({ sku }).lean();
    if (existing?._id) {
      createdIds.push(existing._id);
      idx += 1;
      continue;
    }

    const product = products[idx % products.length];
    const variantName = String(variant_name_snapshot || "").trim() || `Variant ${sku}`;

    const doc = await ProductVariant.create({
      productId: product._id,
      sku,
      barcode: "",
      variantName,
      variantStatus: "active",
      weightGrams: 50 + (idx % 5) * 10,
      volumeMl: 30 + (idx % 4) * 5,
      costAmount: roundAmount(product.price * 0.35),
    });
    createdIds.push(doc._id);
    idx += 1;
  }

  return createdIds;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI environment variable.");

  await mongoose.connect(uri);

  const [
    warehouses,
    products,
    orders,
    orderTotals,
    paymentMethod,
    orderItems,
  ] = await Promise.all([
    // Existing warehouse docs may not have `warehouseStatus` set (schema default is not retroactive),
    // so we fetch all warehouses and treat them as usable.
    Warehouse.find({}).lean(),
    Product.find({ isActive: true }).lean(),
    Order.find({}).select("_id customer_id placed_at placedAt").lean(),
    OrderTotal.find({}).select("grand_total_amount currency_code").lean(),
    PaymentMethod.findOne({ is_active: true }).lean(),
    OrderItem.find({})
      .select("sku_snapshot variant_name_snapshot")
      .limit(250)
      .lean(),
  ]);

  if (!warehouses.length) throw new Error("No active warehouses found; InventoryBalance requires warehouseId.");
  if (!products.length) throw new Error("No products found; ProductVariant requires productId.");
  if (!orders.length) throw new Error("No orders found; Payment/Return require order links.");
  if (!orderTotals.length) throw new Error("No order_totals found; Payment amounts will be meaningless.");
  if (!orderItems.length) throw new Error("No order_items found; cannot derive variant snapshots (sku_snapshot).");

  if (RESET) {
    await Promise.all([
      InventoryBalance.deleteMany({}),
      PaymentTransaction.deleteMany({}),
      PaymentIntent.deleteMany({}),
      ReturnItem.deleteMany({}),
      Return.deleteMany({}),
    ]);
    console.log("Reset: cleared InventoryBalance, PaymentTransaction/Intent, Return/ReturnItem.");
  }

  // -------------------------
  // 1) INVENTORY (20 balances)
  // -------------------------
  const variantIds = await ensureProductVariants({
    needed: TARGET_INVENTORY,
    products,
    orderItems,
  });

  const now = Date.now();
  const inventoryDocs = [];

  for (let i = 0; i < TARGET_INVENTORY; i++) {
    const warehouse = warehouses[i % warehouses.length];
    const variantId = variantIds[i];

    const mix = chooseMix(i, TARGET_INVENTORY);
    let onHandQty;
    let reservedQty;
    let blockedQty;
    let availableQty;
    let reorderPointQty;
    let safetyStockQty;

    if (mix === "high") {
      reservedQty = 2 + (i % 7);
      blockedQty = (i % 3);
      availableQty = 80 + (i % 6) * 15; // 80..165
      onHandQty = availableQty + reservedQty + blockedQty;
      reorderPointQty = 40;
      safetyStockQty = 25;
    } else if (mix === "low") {
      reservedQty = i % 6; // 0..5
      blockedQty = i % 3; // 0..2
      availableQty = 1 + (i % 10); // 1..10
      onHandQty = availableQty + reservedQty + blockedQty;
      reorderPointQty = 15;
      safetyStockQty = 8;
    } else {
      // Out of stock: available = 0, but allow some blocked units in rare cases.
      reservedQty = i % 2; // 0..1
      blockedQty = i % 3; // 0..2
      availableQty = 0;
      onHandQty = reservedQty + blockedQty;
      reorderPointQty = 10;
      safetyStockQty = 5;
    }

    inventoryDocs.push({
      warehouseId: warehouse._id,
      variantId,
      onHandQty,
      reservedQty,
      blockedQty,
      availableQty,
      reorderPointQty,
      safetyStockQty,
      lastCountedAt: new Date(now - (i + 1) * 2 * 86400000),
    });
  }

  await InventoryBalance.insertMany(inventoryDocs);
  console.log(`Inserted InventoryBalance: ${inventoryDocs.length}`);

  // -------------------------
  // 2) PAYMENT (20 payment transactions)
  // -------------------------
  // Note: the existing DB may have corrupted FK data on order_totals.order_id.
  // We still generate realistic amounts by using existing order_totals.grand_total_amount values
  // and linking PaymentIntent/PaymentTransaction to valid Order _id values.
  const orderIds = orders.map((o) => o._id);
  const baseAmounts = orderTotals.map((t) => roundAmount(t.grand_total_amount));
  const currency = "VND";
  const methodId = paymentMethod?._id || null;

  const paymentPlan = [
    // pending (authorized but not captured yet)
    { intentStatus: "authorized", txStatus: "pending", txType: "authorization", factor: 0.5, authFactor: 0.5, capFactor: 0 },
    { intentStatus: "authorized", txStatus: "pending", txType: "authorization", factor: 0.35, authFactor: 0.35, capFactor: 0 },
    { intentStatus: "pending", txStatus: "pending", txType: "authorization", factor: 0.25, authFactor: 0, capFactor: 0 },
    { intentStatus: "authorized", txStatus: "pending", txType: "authorization", factor: 0.6, authFactor: 0.6, capFactor: 0 },
    { intentStatus: "pending", txStatus: "pending", txType: "authorization", factor: 0.4, authFactor: 0, capFactor: 0 },
    { intentStatus: "authorized", txStatus: "pending", txType: "authorization", factor: 0.45, authFactor: 0.45, capFactor: 0 },
    // succeeded (captured)
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 1, authFactor: 1, capFactor: 1 },
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 1, authFactor: 1, capFactor: 1 },
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 0.7, authFactor: 0.7, capFactor: 0.7 },
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 1, authFactor: 1, capFactor: 1 },
    { intentStatus: "captured", txStatus: "success", txType: "capture_partial", factor: 0.65, authFactor: 0.65, capFactor: 0.65 },
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 0.85, authFactor: 0.85, capFactor: 0.85 },
    // failed
    { intentStatus: "failed", txStatus: "failed", txType: "authorization_failed", factor: 0.2, authFactor: 0.2, capFactor: 0 },
    { intentStatus: "failed", txStatus: "failed", txType: "authorization_failed", factor: 0.15, authFactor: 0.15, capFactor: 0 },
    { intentStatus: "failed", txStatus: "failed", txType: "authorization_failed", factor: 0.3, authFactor: 0.3, capFactor: 0 },
    { intentStatus: "failed", txStatus: "failed", txType: "authorization_failed", factor: 0.25, authFactor: 0.25, capFactor: 0 },
    // succeeded (remaining mix)
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 1, authFactor: 1, capFactor: 1 },
    { intentStatus: "captured", txStatus: "success", txType: "capture_partial", factor: 0.75, authFactor: 0.75, capFactor: 0.75 },
    { intentStatus: "authorized", txStatus: "pending", txType: "authorization", factor: 0.3, authFactor: 0.3, capFactor: 0 },
    { intentStatus: "captured", txStatus: "success", txType: "capture", factor: 0.95, authFactor: 0.95, capFactor: 0.95 },
  ];

  if (paymentPlan.length !== TARGET_PAYMENTS) {
    throw new Error(`Internal error: paymentPlan length must be ${TARGET_PAYMENTS}.`);
  }

  const createdPaymentTransactions = [];
  for (let i = 0; i < TARGET_PAYMENTS; i++) {
    const orderId = orderIds[i % orderIds.length];
    const baseAmount = baseAmounts[i % baseAmounts.length] || 0;

    const plan = paymentPlan[i];
    const requestedAmount = baseAmount;
    const authorizedAmount = roundAmount(requestedAmount * plan.authFactor);
    const capturedAmount = roundAmount(requestedAmount * plan.capFactor);
    const txAmount = roundAmount(requestedAmount * plan.factor);

    const providerPrefix = i % 2 === 0 ? "STRIPE" : "VNPay";
    const providerPaymentIntentId = `${providerPrefix}_PI_SEED_${String(i + 1).padStart(4, "0")}`;
    const providerTransactionId = `${providerPrefix}_TX_SEED_${String(i + 1).padStart(4, "0")}`;

    const intent = await PaymentIntent.create({
      order_id: orderId,
      payment_method_id: methodId,
      providerCode: providerPrefix,
      providerPaymentIntentId,
      requestedAmount,
      authorizedAmount,
      capturedAmount,
      currencyCode: currency,
      intentStatus: plan.intentStatus,
    });

    const processedAt = new Date(now - (i + 1) * 3600000);

    const txn = await PaymentTransaction.create({
      paymentIntentId: intent._id,
      order_id: orderId,
      transactionType: plan.txType,
      providerTransactionId,
      transactionStatus: plan.txStatus,
      amount: txAmount,
      currencyCode: currency,
      processedAt,
      rawResponseJson: JSON.stringify({
        seed: true,
        provider: providerPrefix,
        providerTransactionId,
      }),
    });

    createdPaymentTransactions.push(txn);
  }

  console.log(`Inserted PaymentTransaction: ${createdPaymentTransactions.length}`);

  // -------------------------
  // 3) RETURNS (N linked to Customer)
  // -------------------------
  // Existing order documents are partially camelCase; we rely on customer_id which is valid.
  const customerIds = new Set(orders.map((o) => String(o.customer_id)));
  if (!customerIds.size) throw new Error("No valid customer_id found on orders; cannot create returns.");

  const reasons = [
    "Không phù hợp với da (kích ứng nhẹ)",
    "Đóng gói không đúng yêu cầu / thiếu sản phẩm",
    "Sản phẩm không đạt chất lượng mong đợi",
    "Mùi/texture không đúng như mô tả",
    "Da không cải thiện như kỳ vọng sau thời gian dùng",
    "Kích ứng do thành phần cụ thể",
  ];

  const returnStatusPlan = [];
  // 10 returns default: 4 requested, 2 approved, 1 received, 2 completed, 1 rejected
  returnStatusPlan.push(
    "requested",
    "requested",
    "requested",
    "requested",
    "approved",
    "approved",
    "received",
    "completed",
    "completed",
    "rejected"
  );

  const target = TARGET_RETURNS;
  if (target !== returnStatusPlan.length) {
    // If the caller changes TARGET_RETURNS, make a simple repeating plan.
    const basePlan = returnStatusPlan;
    while (returnStatusPlan.length < target) returnStatusPlan.push(basePlan[returnStatusPlan.length % basePlan.length]);
  }

  const createdReturns = [];
  for (let i = 0; i < target; i++) {
    const order = orders[i % orders.length];
    const orderId = order._id;
    const customerId = order.customer_id;

    const status = returnStatusPlan[i];
    const reason = reasons[i % reasons.length];
    const note = status === "rejected"
      ? "Hàng hóa được kiểm tra và không đủ điều kiện hoàn."
      : "Khách vui lòng cung cấp thêm thông tin nếu cần xác minh.";

    const requestedAt = new Date(now - (i + 1) * 3 * 86400000);
    const approvedAt = ["approved", "received", "completed"].includes(status) ? new Date(requestedAt.getTime() + 2 * 86400000) : null;
    const receivedAt = ["received", "completed"].includes(status) ? new Date(requestedAt.getTime() + 4 * 86400000) : null;
    const completedAt = status === "completed" ? new Date(requestedAt.getTime() + 6 * 86400000) : null;

    const doc = await Return.create({
      order_id: orderId,
      requested_by_customer_id: customerId,
      returnNumber: `RET-SEED-${String(1000 + i).padStart(4, "0")}`,
      returnReason: reason,
      returnStatus: status,
      requestedAt,
      approvedAt,
      receivedAt,
      completedAt,
      note,
    });

    createdReturns.push(doc);
  }

  console.log(`Inserted Return: ${createdReturns.length}`);

  // -------------------------
  // 4) RETURN ITEMS (linked to Return + OrderItem + ProductVariant)
  // -------------------------
  const variantDocs = await ProductVariant.find({ _id: { $in: variantIds } })
    .select("_id productId sku variantName")
    .lean();
  const variantById = new Map(variantDocs.map((v) => [String(v._id), v]));

  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const createdReturnItems = [];

  for (let i = 0; i < createdReturns.length; i++) {
    const ret = createdReturns[i];
    const order = orders[i % orders.length];
    const variantId = variantIds[i % variantIds.length];
    const variant = variantById.get(String(variantId));
    const product = variant ? productMap.get(String(variant.productId)) : null;

    // Create a valid order item row dedicated for this return item linkage.
    // This avoids relying on legacy-corrupted order_items references in existing DB.
    const unitPrice = roundAmount((product?.price ?? 120000) * (0.75 + (i % 4) * 0.1));
    const quantity = 1 + (i % 3);
    const lineSubtotal = unitPrice * quantity;
    const lineDiscount = i % 5 === 0 ? roundAmount(lineSubtotal * 0.1) : 0;
    const lineTotal = lineSubtotal - lineDiscount;

    const orderItem = await OrderItem.create({
      order_id: order._id,
      product_id: product?._id ?? products[i % products.length]._id,
      variant_id: variantId,
      sku_snapshot: variant?.sku ?? `SEED-SKU-${i + 1}`,
      product_name_snapshot: product?.productName ?? "Seed Product",
      variant_name_snapshot: variant?.variantName ?? `Seed Variant ${i + 1}`,
      quantity,
      unit_list_price_amount: unitPrice,
      unit_sale_price_amount: unitPrice,
      unit_final_price_amount: unitPrice,
      line_subtotal_amount: lineSubtotal,
      line_discount_amount: lineDiscount,
      line_total_amount: lineTotal,
      currency_code: "VND",
    });

    const reqQty = Math.min(quantity, 1 + (i % 2));
    const status = ret.returnStatus;
    const approvedQty = ["approved", "received", "completed"].includes(status) ? reqQty : 0;
    const receivedQty = ["received", "completed"].includes(status) ? approvedQty : 0;
    const restockQty = status === "completed" ? receivedQty : 0;
    const rejectQty = status === "rejected" ? reqQty : 0;
    const restockStatus =
      status === "completed" ? "restocked" : status === "rejected" ? "disposed" : "pending";

    const returnItem = await ReturnItem.create({
      returnId: ret._id,
      orderItemId: orderItem._id,
      variantId,
      requestedQty: reqQty,
      approvedQty,
      receivedQty,
      restockQty,
      rejectQty,
      restockStatus,
    });
    createdReturnItems.push(returnItem);
  }

  console.log(`Inserted ReturnItem: ${createdReturnItems.length}`);

  // -------------------------
  // Verification (sample checks)
  // -------------------------
  const [invCount, payCount, retCount, retItemCount] = await Promise.all([
    InventoryBalance.countDocuments(),
    PaymentTransaction.countDocuments(),
    Return.countDocuments(),
    ReturnItem.countDocuments(),
  ]);

  console.log("Counts after seed:", {
    inventory: invCount,
    payment: payCount,
    return: retCount,
    returnItem: retItemCount,
  });

  const [badInv, badPayOrder, badReturnCustomer, badReturnItemRef] = await Promise.all([
    (async () => {
      const warehouseIds = new Set(warehouses.map((w) => String(w._id)));
      const variants = await ProductVariant.find({}).select("_id").lean();
      const variantIds = new Set(variants.map((v) => String(v._id)));
      return InventoryBalance.countDocuments({
        $or: [
          { warehouseId: { $nin: Array.from(warehouseIds).map((id) => new mongoose.Types.ObjectId(id)) } },
          { variantId: { $nin: Array.from(variantIds).map((id) => new mongoose.Types.ObjectId(id)) } },
        ],
      });
    })(),
    PaymentTransaction.countDocuments({
      order_id: { $nin: orders.map((o) => o._id) },
    }),
    Return.countDocuments({
      requested_by_customer_id: { $nin: Array.from(customerIds).map((id) => new mongoose.Types.ObjectId(id)) },
    }),
    (async () => {
      const returnIds = createdReturns.map((r) => r._id);
      const orderItemIds = await ReturnItem.distinct("orderItemId");
      const validOrderItemCount = await OrderItem.countDocuments({ _id: { $in: orderItemIds } });
      const validReturnCount = await Return.countDocuments({ _id: { $in: returnIds } });
      const riCount = await ReturnItem.countDocuments({ returnId: { $in: returnIds } });
      const badLinkCount = riCount > 0 && (validOrderItemCount === 0 || validReturnCount === 0) ? riCount : 0;
      return badLinkCount;
    })(),
  ]);

  console.log("Relationship validation (should be 0):", {
    badInv,
    badPayOrder,
    badReturnCustomer,
    badReturnItemRef,
  });

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log("Seed script completed.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Seed script failed:", e);
    process.exit(1);
  });

