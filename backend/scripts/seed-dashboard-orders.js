/**
 * Seed additional dashboard-visible Orders with correct snake_case schema fields.
 *
 * Targets admin dashboard endpoint (`/api/admin/dashboard-summary`) which expects:
 * - Order.placed_at to fall inside selected windows.
 * - OrderTotal.order_id (ObjectId) to join with Order _id.
 * - OrderTotal.grand_total_amount to be non-zero.
 * - OrderItem.product_id + quantity so product aggregation works.
 *
 * Usage:
 *   node scripts/seed-dashboard-orders.js
 *
 * Env:
 *   RESET=1   (default) deletes only previously-seeded dashboard orders (prefix DASH-SEED-*)
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderTotal = require("../models/orderTotal.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const {
  getWindowBounds,
  rangeToDays,
  getPreviousWindow,
  sumRevenueInRange,
} = require("../utils/dashboardRevenue");

const DASH_PREFIX = "DASH-SEED-";
const RESET = process.env.RESET === undefined ? true : process.env.RESET === "1";

function safeToVnd(amount) {
  const n = Number(amount) || 0;
  return n < 0 ? 0 : Math.round(n);
}

function pickOrderedDateWithin(start, end, idx, bucketCount) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const span = endMs - startMs;
  const step = span / (bucketCount + 1);
  const ms = startMs + step * (idx + 1);
  return new Date(ms);
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI environment variable.");

  await mongoose.connect(uri);

  // Legacy unique index may exist with camelCase `orderNumber`, and inserts that don't set
  // that field will violate uniqueness for null values. Drop it if present.
  try {
    await mongoose.connection.collection("orders").dropIndex("orderNumber_1");
    console.log("Dropped legacy index orders.orderNumber_1");
  } catch {
    /* ignore */
  }

  const [customers, products, variants] = await Promise.all([
    Customer.find({}).select("_id customer_code full_name account_id").limit(20).lean(),
    Product.find({ isActive: true }).select("_id productName productCode price").limit(50).lean(),
    ProductVariant.find({ variantStatus: "active" }).select("_id productId sku variantName").limit(100).lean(),
  ]);

  if (!customers.length) throw new Error("No customers found. Cannot seed orders.");
  if (!products.length) throw new Error("No active products found. Cannot seed order items.");
  if (!variants.length) throw new Error("No active product variants found. Cannot seed order items.");

  const productById = new Map(products.map((p) => [String(p._id), p]));
  const variantList = variants.filter((v) => productById.get(String(v.productId)));
  if (variantList.length < 2) throw new Error("Active variants exist, but none map to an active product.");

  if (RESET) {
    const existing = await Order.find({ order_number: { $regex: new RegExp(`^${DASH_PREFIX}`) } })
      .select("_id")
      .lean();
    const orderIds = existing.map((o) => o._id);
    if (orderIds.length) {
      await Promise.all([
        OrderItem.deleteMany({ order_id: { $in: orderIds } }),
        OrderTotal.deleteMany({ order_id: { $in: orderIds } }),
        Order.deleteMany({ _id: { $in: orderIds } }),
      ]);
      console.log(`Reset: removed ${orderIds.length} previous dashboard orders.`);
    }
  }

  const days = 30;
  const { start, end } = getWindowBounds(days);
  const { start: prevStart, end: prevEnd } = getPreviousWindow(start, end);

  const targetOrders = 20; // split 10 in current window, 10 in previous window
  const createdOrderIds = [];

  for (let i = 0; i < targetOrders; i++) {
    const inCurrent = i < 10;
    const date = inCurrent
      ? pickOrderedDateWithin(start, end, i, 10)
      : pickOrderedDateWithin(prevStart, prevEnd, i - 10, 10);

    const customer = customers[i % customers.length];
    const order_number = `${DASH_PREFIX}${String(i + 1).padStart(3, "0")}-${date.toISOString().slice(0, 10).replaceAll("-", "")}`;

    // Keep status combinations realistic for revenue: paid orders are "completed" flow-ish.
    const paid = i % 4 !== 0; // 75% paid
    const order_status = paid ? (i % 3 === 0 ? "confirmed" : "completed") : "processing";
    const payment_status = paid ? "paid" : "unpaid";
    const fulfillment_status = paid ? (i % 3 === 0 ? "fulfilled" : "returned") : "unfulfilled";

    const order = await Order.create({
      order_number,
      customer_id: customer._id,
      currency_code: "VND",
      order_status,
      payment_status,
      fulfillment_status,
      customer_note: i % 2 === 0 ? "Dashboard seed order" : "",
      placed_at: date,
      confirmed_at: paid ? new Date(date.getTime() + 2 * 3600000) : null,
    });

    createdOrderIds.push(order._id);

    const numItems = 2 + (i % 2); // 2 or 3 items
    let subtotal_amount = 0;
    let item_discount_amount = 0;
    const orderItems = [];

    for (let j = 0; j < numItems; j++) {
      const variant = variantList[(i * 3 + j) % variantList.length];
      const product = productById.get(String(variant.productId));

      const quantity = 1 + ((i + j) % 4); // 1..4
      const baseUnitPrice = safeToVnd(product.price);
      const unit_sale_price_amount = safeToVnd(baseUnitPrice * (j % 2 === 0 ? 0.9 : 1));
      const unit_discount = j % 3 === 0 ? safeToVnd(unit_sale_price_amount * 0.08) : 0;

      const unit_final_price_amount = Math.max(unit_sale_price_amount - unit_discount, 0);
      const line_subtotal_amount = safeToVnd(baseUnitPrice * quantity);
      const line_discount_amount = safeToVnd((baseUnitPrice - unit_final_price_amount) * quantity);
      const line_total_amount = Math.max(line_subtotal_amount - line_discount_amount, 0);

      subtotal_amount += line_subtotal_amount;
      item_discount_amount += line_discount_amount;

      orderItems.push({
        order_id: order._id,
        product_id: product._id,
        variant_id: variant._id,
        sku_snapshot: variant.sku,
        product_name_snapshot: product.productName,
        variant_name_snapshot: variant.variantName,
        quantity,
        unit_list_price_amount: baseUnitPrice,
        unit_sale_price_amount,
        unit_final_price_amount,
        line_subtotal_amount,
        line_discount_amount,
        line_total_amount,
        currency_code: "VND",
      });
    }

    const shipping_fee_amount = subtotal_amount >= 800000 ? 0 : 30000;
    const tax_amount = 0;
    const order_discount_amount = 0;
    const grand_total_amount = Math.max(
      subtotal_amount - item_discount_amount - order_discount_amount + shipping_fee_amount + tax_amount,
      0
    );

    await Promise.all([
      OrderItem.insertMany(orderItems),
      OrderTotal.create({
        order_id: order._id,
        subtotal_amount,
        item_discount_amount,
        order_discount_amount,
        shipping_fee_amount,
        tax_amount,
        grand_total_amount,
        refunded_amount: 0,
        currency_code: "VND",
      }),
    ]);
  }

  // Verification
  const totalOrders = await Order.countDocuments();
  const periodOrders = await Order.countDocuments({ placed_at: { $gte: start, $lte: end } });
  const revenue = await sumRevenueInRange(OrderTotal, start, end);

  console.log("Dashboard seed verification:", {
    createdOrderIds: createdOrderIds.length,
    totalOrders,
    periodOrders,
    revenue,
  });

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log("seed-dashboard-orders completed.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("seed-dashboard-orders failed:", e);
    process.exit(1);
  });

