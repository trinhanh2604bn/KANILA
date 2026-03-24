const mongoose = require("mongoose");
const RecommendationLog = require("../models/recommendation-log.model");
const Product = require("../models/product.model");

function ensureAdmin(req, res) {
  const type = String(req.user?.account_type || "").toLowerCase();
  if (!["admin", "super_admin"].includes(type)) {
    res.status(403).json({ success: false, message: "Admin permission required" });
    return false;
  }
  return true;
}

const getOverview = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const [totalImpressions, uniqueCustomers, topContexts, versions] = await Promise.all([
      RecommendationLog.countDocuments(),
      RecommendationLog.distinct("customer_id"),
      RecommendationLog.aggregate([
        { $group: { _id: "$context", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      RecommendationLog.distinct("algorithm_version"),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        total_impressions: totalImpressions,
        unique_customers_recommended_to: uniqueCustomers.filter(Boolean).length,
        total_recommended_products_served: totalImpressions,
        top_contexts: topContexts,
        algorithm_versions: versions,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTopReasons = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const rows = await RecommendationLog.aggregate([
      { $unwind: "$reason_codes" },
      { $group: { _id: "$reason_codes", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTopProducts = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const rows = await RecommendationLog.aggregate([
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "p" } },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      { $project: { product_id: "$_id", count: 1, product_name: "$p.productName", brand_id: "$p.brandId" } },
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTopBrands = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const rows = await RecommendationLog.aggregate([
      { $lookup: { from: "products", localField: "product_id", foreignField: "_id", as: "p" } },
      { $unwind: "$p" },
      { $group: { _id: "$p.brandId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $lookup: { from: "brands", localField: "_id", foreignField: "_id", as: "b" } },
      { $unwind: { path: "$b", preserveNullAndEmptyArrays: true } },
      { $project: { brand_id: "$_id", count: 1, brand_name: "$b.brandName" } },
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getByContext = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const rows = await RecommendationLog.aggregate([
      { $group: { _id: "$context", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTimeline = async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const rows = await RecommendationLog.aggregate([
      {
        $group: {
          _id: {
            y: { $year: "$generated_at" },
            m: { $month: "$generated_at" },
            d: { $dayOfMonth: "$generated_at" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      {
        $project: {
          date: {
            $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" },
          },
          count: 1,
        },
      },
    ]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview,
  getTopReasons,
  getTopProducts,
  getTopBrands,
  getByContext,
  getTimeline,
};
