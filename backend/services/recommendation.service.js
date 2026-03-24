const Product = require("../models/product.model");
const Customer = require("../models/customer.model");
const CustomerPreference = require("../models/customerPreference.model");
const Wishlist = require("../models/wishlist.model");
const WishlistItem = require("../models/wishlistItem.model");
const Order = require("../models/order.model");
const OrderItem = require("../models/orderItem.model");

const WEIGHTS = {
  exactSkinType: 25,
  acceptableSkinType: 15,
  concernMatch: 12,
  ingredientPrefMatch: 8,
  favoriteBrand: 10,
  ratingReview: 8,
  bestSeller: 6,
  priceMatch: 6,
  behaviorAffinity: 7,
  sensitiveMismatch: -25,
  hardSkinMismatch: -30,
  ingredientConflict: -40,
};

const toArray = (v) => {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  const raw = String(v).trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((x) => String(x || "").trim()).filter(Boolean);
  } catch {}
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
};

const toLowerSet = (arr) => new Set(toArray(arr).map((x) => x.toLowerCase()));

async function getCustomerAndSkinProfile(accountId) {
  const customer = await Customer.findOne({ account_id: accountId }).select("_id");
  if (!customer) return { customer: null, profile: null };
  const prefs = await CustomerPreference.find({
    customer_id: customer._id,
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
  const profile = {
    skin_types: toArray(map.get("skin_type")),
    skin_tone: String((toArray(map.get("skin_tone"))[0] || "")).trim(),
    eye_color: String((toArray(map.get("eye_color"))[0] || "")).trim(),
    concerns: toArray(map.get("concerns")),
    ingredient_preferences: toArray(map.get("ingredient_preferences")),
    favorite_brands: toArray(map.get("favorite_brands")),
    price_range_preference: String((toArray(map.get("price_range_preference"))[0] || "")).trim(),
    routine_goal: String((toArray(map.get("routine_goal"))[0] || "")).trim(),
  };
  return { customer, profile };
}

async function getBehaviorSignals(customerId) {
  if (!customerId) return { orderedProductIds: new Set(), wishlistProductIds: new Set(), wishlistBrandIds: new Set() };
  const wishlists = await Wishlist.find({ customer_id: customerId }).select("_id");
  const wishlistIds = wishlists.map((w) => w._id);
  const [wishlistItems, orders] = await Promise.all([
    wishlistIds.length ? WishlistItem.find({ wishlistId: { $in: wishlistIds } }).select("productId").lean() : [],
    Order.find({ customer_id: customerId }).select("_id").sort({ placed_at: -1 }).limit(20).lean(),
  ]);
  const orderIds = orders.map((o) => o._id);
  const orderItems = orderIds.length ? await OrderItem.find({ order_id: { $in: orderIds } }).select("product_id").lean() : [];

  return {
    orderedProductIds: new Set(orderItems.map((x) => String(x.product_id))),
    wishlistProductIds: new Set(wishlistItems.map((x) => String(x.productId))),
    wishlistBrandIds: new Set(),
  };
}

function buildReason(text, reasons) {
  if (reasons.length < 3 && !reasons.includes(text)) reasons.push(text);
}

function scoreProduct(product, profile, behavior) {
  let score = 0;
  const reasons = [];

  if (product.productStatus === "inactive" || product.isActive === false) return { eligible: false, score: -999, reasons };
  if (Number(product.stock || 0) <= 0) return { eligible: false, score: -999, reasons };

  const userSkin = toLowerSet(profile.skin_types);
  const productSkin = toLowerSet(product.skin_types_supported);
  if (userSkin.size && productSkin.size) {
    const overlap = [...userSkin].filter((x) => productSkin.has(x));
    if (overlap.length) {
      score += WEIGHTS.exactSkinType;
      buildReason(`Phù hợp với ${profile.skin_types[0] || "làn da của bạn"}`, reasons);
    } else {
      score += WEIGHTS.hardSkinMismatch;
    }
  }

  const concerns = toLowerSet(profile.concerns);
  const targeted = toLowerSet(product.concerns_targeted);
  let concernMatches = 0;
  for (const c of concerns) if (targeted.has(c)) concernMatches += 1;
  if (concernMatches > 0) {
    score += concernMatches * WEIGHTS.concernMatch;
    buildReason(`Hỗ trợ tình trạng ${profile.concerns[0] || "da"} của bạn`, reasons);
  }

  const prefIngredients = toLowerSet(profile.ingredient_preferences);
  const productFlags = toLowerSet(product.ingredient_flags);
  let prefMatches = 0;
  for (const p of prefIngredients) if (productFlags.has(p)) prefMatches += 1;
  if (prefMatches > 0) {
    score += prefMatches * WEIGHTS.ingredientPrefMatch;
    if (prefIngredients.has("fragrance-free") && productFlags.has("fragrance-free")) buildReason("Không chứa hương liệu", reasons);
  }

  const brandName = String(product.brandId?.brandName || "").toLowerCase();
  if (toLowerSet(profile.favorite_brands).has(brandName)) {
    score += WEIGHTS.favoriteBrand;
    buildReason("Đến từ thương hiệu bạn yêu thích", reasons);
  }

  const rating = Number(product.averageRating || 0);
  if (rating >= 4.2) score += WEIGHTS.ratingReview;
  if (product.is_best_seller || Number(product.sales_count || product.bought || 0) > 200) {
    score += WEIGHTS.bestSeller;
    buildReason("Best Seller", reasons);
  }

  if (behavior.wishlistProductIds.has(String(product._id)) || behavior.orderedProductIds.has(String(product._id))) {
    score += WEIGHTS.behaviorAffinity;
  }

  if (product.is_sensitive_friendly === false && toLowerSet(profile.concerns).has("đỏ rát")) {
    score += WEIGHTS.sensitiveMismatch;
  }

  const badges = [];
  if (score >= 25) badges.push("Phù hợp với bạn");
  if (product.is_best_seller || Number(product.sales_count || product.bought || 0) > 200) badges.push("Best Seller");
  if (productFlags.has("fragrance-free")) badges.push("Không hương liệu");

  return { eligible: true, score, reasons, badges };
}

function diversify(sorted, max = 12) {
  const out = [];
  const brandCap = new Map();
  const categoryCap = new Map();
  for (const item of sorted) {
    if (out.length >= max) break;
    const brand = String(item.product.brandId?._id || "");
    const category = String(item.product.categoryId?._id || "");
    const bCount = brandCap.get(brand) || 0;
    const cCount = categoryCap.get(category) || 0;
    if (bCount >= 3 || cCount >= 4) continue;
    out.push(item);
    brandCap.set(brand, bCount + 1);
    categoryCap.set(category, cCount + 1);
  }
  return out;
}

async function recommendForProfile(profile, opts = {}) {
  const category = String(opts.category || "").trim().toLowerCase();
  let products = await Product.find({
    productStatus: { $ne: "inactive" },
    isActive: { $ne: false },
  }).populate("brandId", "brandName").populate("categoryId", "categoryName").lean();
  if (category) {
    products = products.filter((p) =>
      String(p.categoryId?.categoryName || "").toLowerCase().includes(category) ||
      String(p.productName || "").toLowerCase().includes(category) ||
      String(p.shortDescription || "").toLowerCase().includes(category)
    );
  }

  const behavior = opts.behavior || { orderedProductIds: new Set(), wishlistProductIds: new Set(), wishlistBrandIds: new Set() };

  const scored = products
    .map((p) => {
      const result = scoreProduct(p, profile, behavior);
      return { product: p, ...result };
    })
    .filter((x) => x.eligible)
    .sort((a, b) => b.score - a.score);

  const diversified = diversify(scored, Number(opts.limit || 12));
  return diversified.map((x) => ({
    productId: String(x.product._id),
    score: x.score,
    reasons: x.reasons.slice(0, 3),
    badges: x.badges || [],
    product: {
      _id: String(x.product._id),
      productName: x.product.productName,
      slug: x.product.slug || String(x.product._id),
      imageUrl: x.product.imageUrl || "",
      price: Number(x.product.price || 0),
      averageRating: Number(x.product.averageRating || 0),
      bought: Number(x.product.bought || 0),
      brandName: x.product.brandId?.brandName || "",
    },
  }));
}

module.exports = {
  WEIGHTS,
  getCustomerAndSkinProfile,
  getBehaviorSignals,
  recommendForProfile,
};
