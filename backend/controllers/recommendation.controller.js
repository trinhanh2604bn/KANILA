const validateObjectId = require("../utils/validateObjectId");
const {
  getCustomerAndSkinProfile,
  getBehaviorSignals,
  recommendForProfile,
} = require("../services/recommendation.service");

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
    const items = await recommendForProfile(profile, { category, limit, behavior });
    return res.status(200).json({ success: true, message: "Get personalized recommendations successfully", data: items });
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
    const items = await recommendForProfile(profile, { category, limit });
    return res.status(200).json({ success: true, message: "Preview recommendations generated", data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyRecommendations,
  previewRecommendations,
};
