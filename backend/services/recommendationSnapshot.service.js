const crypto = require("crypto");
const mongoose = require("mongoose");

const Product = require("../models/product.model");
const CustomerPreference = require("../models/customerPreference.model");
const {
  getBehaviorSignals,
  recommendForProfile,
  ALGORITHM_VERSION,
} = require("./recommendation.service");

const CustomerRecommendationSnapshot = require("../models/customerRecommendationSnapshot.model");
const { loadPrimaryMediaUrlByProductIds, resolveListingSelect } = require("../utils/productListingHelpers");

function stableArray(arr) {
  if (!Array.isArray(arr)) return [];
  const out = arr.map((x) => String(x ?? "").trim()).filter(Boolean);
  // lowercasing improves stability across casing variants
  out.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return out;
}

function stableProfileForHash(profile) {
  return {
    skin_types: stableArray(profile.skin_types),
    skin_tone: String(profile.skin_tone ?? "").trim(),
    eye_color: String(profile.eye_color ?? "").trim(),
    concerns: stableArray(profile.concerns),
    ingredient_preferences: stableArray(profile.ingredient_preferences),
    favorite_brands: stableArray(profile.favorite_brands),
    routine_goal: String(profile.routine_goal ?? "").trim(),
    price_range_preference: String(profile.price_range_preference ?? "").trim(),
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function computeProfileHash(profile) {
  return sha256(JSON.stringify(stableProfileForHash(profile)));
}

async function getSkinProfileByCustomerId(customerId) {
  // Keep keys in sync with recommendation.service.js getCustomerAndSkinProfile()
  const prefs = await CustomerPreference.find({
    customer_id: customerId,
    preference_key: {
      $in: [
        "skin_type",
        "skin_tone",
        "eye_color",
        "concerns",
        "ingredient_preferences",
        "favorite_brands",
        "price_range_preference",
        "routine_goal",
      ],
    },
  }).lean();

  const map = new Map(prefs.map((p) => [p.preference_key, p.preference_value]));

  const toArrayPref = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map((x) => String(x ?? "").trim()).filter(Boolean);
    const raw = String(v).trim();
    if (!raw) return [];
    if (raw.startsWith("[") || raw.startsWith("{")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x ?? "").trim()).filter(Boolean);
        return [];
      } catch {
        return [];
      }
    }
    return raw.split(",").map((x) => x.trim()).filter(Boolean);
  };

  const toStringPref = (v) => {
    const raw = v == null ? "" : String(v).trim();
    return raw;
  };

  return {
    skin_types: toArrayPref(map.get("skin_type")),
    skin_tone: String(toArrayPref(map.get("skin_tone"))[0] || "").trim(),
    eye_color: String(toArrayPref(map.get("eye_color"))[0] || "").trim(),
    concerns: toArrayPref(map.get("concerns")),
    ingredient_preferences: toArrayPref(map.get("ingredient_preferences")),
    favorite_brands: toArrayPref(map.get("favorite_brands")),
    price_range_preference: toStringPref(map.get("price_range_preference")),
    routine_goal: toStringPref(map.get("routine_goal")),
  };
}

function getSnapshotType(recommendationType) {
  // Allow future extension while keeping current contract stable.
  return String(recommendationType || "skin_profile_homepage").trim();
}

function shouldUseSnapshot(snapshotDoc, { profileHash, now }) {
  if (!snapshotDoc) return false;
  if (!snapshotDoc.profile_hash) return false;
  if (String(snapshotDoc.profile_hash) !== String(profileHash)) return false;
  if (snapshotDoc.invalidated_at) return false;
  if (snapshotDoc.expires_at && now instanceof Date && snapshotDoc.expires_at instanceof Date) {
    if (snapshotDoc.expires_at.getTime() < now.getTime()) return false;
  }
  return true;
}

async function generateSnapshotByAccountId({ accountId, recommendationType = "skin_profile_homepage", limit = 20, ttlHours = 48 }) {
  // We regenerate based on customer skin profile + behavior signals.
  // Using getBehaviorSignals() keeps recommendations consistent with the existing engine.
  const { customer, profile } = await (async () => {
    // Avoid pulling full account model; we only need customer id to fetch preferences.
    // Recommendation engine uses CustomerPreference + behavior signals by customer id.
    // `accountId` is the authenticated account identity (req.user.account_id).
    const Customer = require("../models/customer.model");
    const cust = await Customer.findOne({ account_id: accountId }).select("_id").lean();
    if (!cust) return { customer: null, profile: null };
    const prof = await getSkinProfileByCustomerId(cust._id);
    return { customer: cust, profile: prof };
  })();

  if (!customer || !profile) return null;

  const behavior = await getBehaviorSignals(customer._id);
  const items = await recommendForProfile(profile, { category: "", limit, behavior });

  const productIds = items.map((it) => new mongoose.Types.ObjectId(it.productId));
  const snapshotItems = items.map((it) => ({
    product_id: new mongoose.Types.ObjectId(it.productId),
    score: Number(it.score || 0),
    reasons: Array.isArray(it.reasons) ? it.reasons.slice(0, 3) : [],
    reason_codes: Array.isArray(it.reason_codes) ? it.reason_codes : [],
    badges: Array.isArray(it.badges) ? it.badges : [],
    score_breakdown: it.score_breakdown || {},
  }));

  const now = new Date();
  const profileHash = computeProfileHash(profile);
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const recType = getSnapshotType(recommendationType);

  const algorithmVersion = items?.[0]?.algorithm_version || ALGORITHM_VERSION;

  await CustomerRecommendationSnapshot.findOneAndUpdate(
    { customer_id: customer._id, recommendation_type: recType },
    {
      customer_id: customer._id,
      recommendation_type: recType,
      profile_hash: profileHash,
      product_ids: productIds,
      items: snapshotItems,
      algorithm_version: algorithmVersion,
      generated_at: now,
      expires_at: expiresAt,
      invalidated_at: null,
    },
    { upsert: true, new: true }
  );

  return CustomerRecommendationSnapshot.findOne({ customer_id: customer._id, recommendation_type: recType }).lean();
}

async function loadProductsBySnapshotItems({ snapshotItems, ids }) {
  const listingProfile = "card";
  const selectFields = resolveListingSelect(listingProfile);

  const rows = await Product.find({ _id: { $in: ids } })
    .select(selectFields)
    .populate("brandId", "brandName brandCode")
    .lean();

  const rowsById = new Map(rows.map((p) => [String(p._id), p]));

  const idsWithoutImage = ids
    .map((id) => String(id))
    .filter((id) => rowsById.get(id) && !rowsById.get(id).imageUrl)
    .map((id) => new mongoose.Types.ObjectId(id));

  const mediaMap = idsWithoutImage.length ? await loadPrimaryMediaUrlByProductIds(idsWithoutImage) : new Map();

  // Preserve snapshot ordering.
  const orderedProducts = [];
  for (const snapIt of snapshotItems) {
    const pid = String(snapIt.product_id);
    const p = rowsById.get(pid);
    if (!p) continue;

    const productIsActive = p.productStatus !== "inactive" && p.isActive !== false;
    const inStock = Number(p.stock || 0) > 0;
    if (!productIsActive || !inStock) continue;

    // Attach the first reason as shortDescription for the card overlay/quick view.
    const firstReason = Array.isArray(snapIt.reasons) ? snapIt.reasons[0] : null;
    if (firstReason) p.shortDescription = firstReason;

    if (!p.imageUrl && mediaMap.has(pid)) p.imageUrl = mediaMap.get(pid);

    // Ensure JSON payload uses stable string ids (client-side Product model expects string _id).
    if (p._id) p._id = String(p._id);
    if (p.brandId?._id) p.brandId._id = String(p.brandId._id);
    if (p.categoryId?._id) p.categoryId._id = String(p.categoryId._id);

    orderedProducts.push(p);
  }

  return orderedProducts;
}

async function getHomepageSnapshotProducts({ accountId, limit = 20, ttlHours = 48, minValidCount = 8, recommendationType = "skin_profile_homepage" }) {
  // Developer notes:
  // - This endpoint exists to avoid re-scoring the full catalog on every homepage load.
  // - We persist a ranked snapshot (top-N product ids + lightweight ranking metadata) when:
  //   1) the snapshot is missing, or
  //   2) the customer skin profile hash changed, or
  //   3) the snapshot expired, or
  //   4) too many products are no longer eligible (inactive/out-of-stock).
  // - Homepage reads the snapshot first and only regenerates when necessary.
  const recType = getSnapshotType(recommendationType);
  const Customer = require("../models/customer.model");
  const cust = await Customer.findOne({ account_id: accountId }).select("_id").lean();
  if (!cust) return [];
  const now = new Date();

  const profile = await getSkinProfileByCustomerId(cust._id);
  const profileHash = computeProfileHash(profile);

  const snapshotDoc = await CustomerRecommendationSnapshot.findOne({
    customer_id: cust._id,
    recommendation_type: recType,
  }).lean();

  const shouldRefresh = !shouldUseSnapshot(snapshotDoc, { profileHash, now });
  let finalSnapshotDoc = snapshotDoc;

  if (!finalSnapshotDoc || shouldRefresh) {
    finalSnapshotDoc = await generateSnapshotByAccountId({ accountId, recommendationType: recType, limit, ttlHours });
  }

  if (!finalSnapshotDoc) return [];

  const snapshotItems = Array.isArray(finalSnapshotDoc.items) ? finalSnapshotDoc.items.slice(0, limit) : [];
  const ids = snapshotItems.map((it) => it.product_id);

  let products = await loadProductsBySnapshotItems({ snapshotItems, ids });

  if (products.length < minValidCount) {
    finalSnapshotDoc = await generateSnapshotByAccountId({ accountId, recommendationType: recType, limit, ttlHours });
    const refreshedItems = Array.isArray(finalSnapshotDoc?.items) ? finalSnapshotDoc.items.slice(0, limit) : [];
    const refreshedIds = refreshedItems.map((it) => it.product_id);
    products = await loadProductsBySnapshotItems({ snapshotItems: refreshedItems, ids: refreshedIds });
  }

  return products;
}

module.exports = {
  SNAPSHOT_RECOMMENDATION_TYPE: "skin_profile_homepage",
  computeProfileHash,
  getSkinProfileByCustomerId,
  generateSnapshotByAccountId,
  getHomepageSnapshotProducts,
};

