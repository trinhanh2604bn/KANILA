const validateObjectId = require("../utils/validateObjectId");
const RecommendationLog = require("../models/recommendation-log.model");
const {
  ALGORITHM_VERSION,
  getCustomerAndSkinProfile,
  getBehaviorSignals,
  recommendForProfile,
} = require("../services/recommendation.service");
const { getHomepageSnapshotProducts, SNAPSHOT_RECOMMENDATION_TYPE } = require("../services/recommendationSnapshot.service");

function resolveContext(req) {
  const c = String(req.query?.context || req.body?.context || "").trim().toLowerCase();
  if (["homepage", "profile_page", "category_page", "preview"].includes(c)) return c;
  return "unknown";
}

async function logFinalRecommendations({ customerId, items, context, categoryContext, req }) {
  if (!Array.isArray(items) || !items.length) return;
  const logs = items.map((it, idx) => ({
    customer_id: customerId || null,
    product_id: it.productId,
    context,
    category_context: categoryContext || "",
    score: Number(it.score || 0),
    reason_codes: Array.isArray(it.reason_codes) ? it.reason_codes : [],
    reasons: Array.isArray(it.reasons) ? it.reasons : [],
    badges: Array.isArray(it.badges) ? it.badges : [],
    score_breakdown: it.score_breakdown || {},
    rank_position: idx + 1,
    generated_at: new Date(),
    algorithm_version: it.algorithm_version || ALGORITHM_VERSION,
    session_id: String(req.headers["x-session-id"] || ""),
    request_source: String(req.headers["user-agent"] || ""),
  }));
  await RecommendationLog.insertMany(logs, { ordered: false });
}

// GET /api/recommendations/me
const getMyRecommendations = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }
    const { customer, profile } = await getCustomerAndSkinProfile(accountId);
    if (!customer || !profile) {
      return res.status(404).json({ success: false, message: "Skin profile not found" });
    }
    const behavior = await getBehaviorSignals(customer._id);
    const category = req.query?.category || "";
    const limit = Number(req.query?.limit || 12);
    const context = resolveContext(req);
    const items = await recommendForProfile(profile, { category, limit, behavior });
    await logFinalRecommendations({
      customerId: customer._id,
      items,
      context,
      categoryContext: category,
      req,
    });
    return res.status(200).json({
      success: true,
      message: "Get personalized recommendations successfully",
      algorithm_version: ALGORITHM_VERSION,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/recommendations/preview
const previewRecommendations = async (req, res) => {
  try {
    const payload = req.body || {};
    const profile = {
      skin_types: Array.isArray(payload.skin_types) ? payload.skin_types : [],
      skin_tone: String(payload.skin_tone || ""),
      eye_color: String(payload.eye_color || ""),
      concerns: Array.isArray(payload.concerns) ? payload.concerns : [],
      ingredient_preferences: Array.isArray(payload.ingredient_preferences) ? payload.ingredient_preferences : [],
      favorite_brands: Array.isArray(payload.favorite_brands) ? payload.favorite_brands : [],
      routine_goal: String(payload.routine_goal || ""),
      price_range_preference: String(payload.price_range_preference || ""),
    };
    const category = req.query?.category || "";
    const limit = Number(req.query?.limit || 12);
    const context = "preview";
    const items = await recommendForProfile(profile, { category, limit });
    await logFinalRecommendations({
      customerId: null,
      items,
      context,
      categoryContext: category,
      req,
    });
    return res.status(200).json({
      success: true,
      message: "Preview recommendations generated",
      algorithm_version: ALGORITHM_VERSION,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/recommendations/me/homepage
// Fast path: reads persistent recommendation snapshot, generates it only when missing/stale.
const getMyHomepageRecommendations = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }

    const limit = Number(req.query?.limit || 20);
    const products = await getHomepageSnapshotProducts({
      accountId,
      limit,
      ttlHours: Number(req.query?.ttlHours || 48),
      minValidCount: Number(req.query?.minValidCount || 8),
      recommendationType: SNAPSHOT_RECOMMENDATION_TYPE,
    });

    return res.status(200).json({
      success: true,
      message: "Get personalized homepage recommendations successfully",
      algorithm_version: ALGORITHM_VERSION,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/recommendations/me/all
// Returns the full ranked list (up to 20) from the same persisted snapshot.
const getMyAllRecommendations = async (req, res) => {
  try {
    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId || !validateObjectId(accountId)) {
      return res.status(401).json({ success: false, message: "Invalid or missing account identity" });
    }

    const limit = Number(req.query?.limit || 20);
    const products = await getHomepageSnapshotProducts({
      accountId,
      limit,
      ttlHours: Number(req.query?.ttlHours || 48),
      minValidCount: Number(req.query?.minValidCount || 8),
      recommendationType: SNAPSHOT_RECOMMENDATION_TYPE,
    });

    return res.status(200).json({
      success: true,
      message: "Get personalized recommendations successfully",
      algorithm_version: ALGORITHM_VERSION,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyRecommendations,
  previewRecommendations,
  getMyHomepageRecommendations,
  getMyAllRecommendations,
};
