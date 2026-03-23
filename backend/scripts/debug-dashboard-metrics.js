require("dotenv").config();
const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderTotal = require("../models/orderTotal.model");
const Product = require("../models/product.model");
const { sumRevenueInRange, getWindowBounds, rangeToDays } = require("../utils/dashboardRevenue");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const range = process.env.RANGE || "30d";
  const days = rangeToDays(range);
  const { start, end } = getWindowBounds(days);

  const totalOrders = await Order.countDocuments();
  const periodOrders = await Order.countDocuments({ placed_at: { $gte: start, $lte: end } });
  const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10 }, isActive: true });
  const revenue = await sumRevenueInRange(OrderTotal, start, end);

  console.log(
    JSON.stringify(
      {
        range,
        start: start.toISOString(),
        end: end.toISOString(),
        totalOrders,
        periodOrders,
        lowStockProducts,
        revenue,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

