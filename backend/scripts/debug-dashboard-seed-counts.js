require("dotenv").config();
const mongoose = require("mongoose");

const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");
const OrderTotal = require("../models/orderTotal.model");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const prefix = process.env.DASH_PREFIX || "DASH-SEED-";
  const regex = new RegExp("^" + prefix);

  const orders = await Order.find({ order_number: { $regex: regex } }).select("_id").lean();
  const ids = orders.map((o) => o._id);

  const [orderItems, orderTotals] = await Promise.all([
    OrderItem.countDocuments({ order_id: { $in: ids } }),
    OrderTotal.countDocuments({ order_id: { $in: ids } }),
  ]);

  console.log(
    JSON.stringify(
      {
        prefix,
        dashOrders: orders.length,
        dashOrderItems: orderItems,
        dashOrderTotals: orderTotals,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

