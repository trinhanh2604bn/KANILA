const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Account = require("../models/account.model");
const OrderTotal = require("../models/orderTotal.model");
const OrderItem = require("../models/orderItem.model");
const {
  sumRevenueInRange,
  getDailyRevenueSeries,
  rangeToDays,
  getWindowBounds,
  getPreviousWindow,
  pctChange,
} = require("../utils/dashboardRevenue");

// GET /api/admin/dashboard-summary?range=7d|30d|90d
const getDashboardSummary = async (req, res) => {
  try {
    const range = req.query.range || "30d";
    const days = rangeToDays(range);
    const { start, end } = getWindowBounds(days);
    const { start: prevStart, end: prevEnd } = getPreviousWindow(start, end);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalAccounts,
      lowStockProducts,
      periodRevenue,
      prevRevenue,
      periodOrders,
      prevOrders,
      salesChart,
      recentOrders,
      topProductsAgg,
      lowStockItems,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Customer.countDocuments(),
      Account.countDocuments(),
      Product.countDocuments({ stock: { $lte: 10 }, isActive: true }),
      sumRevenueInRange(OrderTotal, start, end),
      sumRevenueInRange(OrderTotal, prevStart, prevEnd),
      Order.countDocuments({ placedAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ placedAt: { $gte: prevStart, $lte: prevEnd } }),
      getDailyRevenueSeries(OrderTotal, start, end),
      Order.find()
        .populate("customerId", "fullName customerCode")
        .sort({ placedAt: -1 })
        .limit(10),
      OrderItem.aggregate([
        { $group: { _id: "$productId", sold: { $sum: "$quantity" } } },
        { $sort: { sold: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "p",
          },
        },
        { $unwind: "$p" },
        {
          $project: {
            _id: 1,
            title: "$p.productName",
            sales: "$sold",
          },
        },
      ]),
      Product.find({ stock: { $lte: 10 }, isActive: true })
        .sort({ stock: 1 })
        .limit(5)
        .select("productName stock")
        .lean(),
    ]);

    const revenueTrend = pctChange(periodRevenue, prevRevenue);
    const ordersTrend = pctChange(periodOrders, prevOrders);

    res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved",
      data: {
        range,
        totalProducts,
        totalOrders,
        totalCustomers,
        totalAccounts,
        totalRevenue: periodRevenue,
        revenueTrend,
        periodOrders,
        ordersTrend,
        lowStockProducts,
        salesChart,
        topProducts: topProductsAgg.map((r) => ({
          id: String(r._id),
          title: r.title,
          sales: r.sales,
        })),
        lowStockItems: lowStockItems.map((p) => ({
          id: String(p._id),
          title: p.productName,
          stock: p.stock,
        })),
        recentOrders: recentOrders.map((o) => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          customerName: o.customerId?.fullName || "N/A",
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          placedAt: o.placedAt,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardSummary };
