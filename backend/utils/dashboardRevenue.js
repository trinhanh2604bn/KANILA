const ORDER_COLL = "orders";

/**
 * Sum grand totals for orders whose placed_at falls in [start, end] (inclusive).
 */
async function sumRevenueInRange(OrderTotal, start, end) {
  const rows = await OrderTotal.aggregate([
    {
      $lookup: {
        from: ORDER_COLL,
        localField: "order_id",
        foreignField: "_id",
        as: "ord",
      },
    },
    { $unwind: "$ord" },
    {
      $match: {
        "ord.placed_at": { $gte: start, $lte: end },
      },
    },
    { $group: { _id: null, total: { $sum: "$grand_total_amount" } } },
  ]);
  return rows[0]?.total || 0;
}

/**
 * Daily revenue buckets for chart: { label, value } for each calendar day in range.
 */
async function getDailyRevenueSeries(OrderTotal, start, end) {
  const agg = await OrderTotal.aggregate([
    {
      $lookup: {
        from: ORDER_COLL,
        localField: "order_id",
        foreignField: "_id",
        as: "ord",
      },
    },
    { $unwind: "$ord" },
    {
      $match: {
        "ord.placed_at": { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$ord.placed_at" },
        },
        revenue: { $sum: "$grand_total_amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDay = new Map(agg.map((r) => [r._id, r.revenue]));

  const series = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cursor <= endDay) {
    const key = cursor.toISOString().slice(0, 10);
    const value = byDay.get(key) || 0;
    const label = cursor.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
    series.push({ label, value });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
}

function rangeToDays(range) {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

function getWindowBounds(days) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function getPreviousWindow(start, end) {
  const ms = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd.getTime() - ms);
  prevStart.setHours(0, 0, 0, 0);
  return { start: prevStart, end: prevEnd };
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

module.exports = {
  sumRevenueInRange,
  getDailyRevenueSeries,
  rangeToDays,
  getWindowBounds,
  getPreviousWindow,
  pctChange,
};
