const mongoose = require("mongoose");
const Product = require("../models/product.model");
const ProductMedia = require("../models/productMedia.model");
const validateObjectId = require("./validateObjectId");

/** Storefront listing projection — keep in sync with product listing API. */
const PRODUCT_LISTING_FIELDS = [
  "productName",
  "productCode",
  "slug",
  "brandId",
  "categoryId",
  "price",
  "compareAtPrice",
  "imageUrl",
  "shortDescription",
  "stock",
  "bought",
  "averageRating",
  "isActive",
  "productStatus",
  "skin_types_supported",
  "concerns_targeted",
  "ingredient_flags",
  "key_ingredients",
  "is_sensitive_friendly",
  "tone_match_supported",
  "finish_type",
  "coverage_type",
  "sales_count",
  "is_best_seller",
].join(" ");

/**
 * Lighter card/grid payload — omits extended facet fields the catalog derives from facet tables.
 * Opt-in: `GET /api/products?page=…&fields=card` (default remains full projection).
 */
const PRODUCT_LISTING_FIELDS_CARD = [
  "productName",
  "productCode",
  "slug",
  "brandId",
  "categoryId",
  "price",
  "compareAtPrice",
  "imageUrl",
  "shortDescription",
  "stock",
  "bought",
  "averageRating",
  "isActive",
  "productStatus",
].join(" ");

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 24;

/**
 * Pagination is active only when `page` query param is sent (backward compatible with full list).
 */
function parsePaginationParams(query) {
  if (!query || query.page === undefined || query.page === null || String(query.page).trim() === "") {
    return { enabled: false, page: 1, limit: DEFAULT_PAGE_SIZE };
  }
  const parsed = parseInt(String(query.page), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { enabled: false, page: 1, limit: DEFAULT_PAGE_SIZE };
  }
  const page = Math.max(1, parsed);
  const limitRaw = query.limit != null ? parseInt(String(query.limit), 10) : DEFAULT_PAGE_SIZE;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE));
  return { enabled: true, page, limit };
}

/** Catalog bundle: always paginated (defaults page=1, limit=24). */
function parseCatalogPagination(query) {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limitRaw = parseInt(String(query.limit ?? String(DEFAULT_PAGE_SIZE)), 10);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseSortKey(sortRaw) {
  const s = String(sortRaw || "newest").toLowerCase().trim();
  if (s === "price_asc") return { price: 1, createdAt: -1 };
  if (s === "price_desc") return { price: -1, createdAt: -1 };
  if (s === "popular" || s === "bought") return { bought: -1, createdAt: -1 };
  if (s === "hot_deal") return { bought: -1, createdAt: -1 };
  return { createdAt: -1 };
}

/**
 * @param {Record<string, unknown>} query
 * @param {{ storefrontOnly?: boolean }} [opts]
 */
function buildMongoFilterFromQuery(query, opts = {}) {
  const storefrontOnly = !!opts.storefrontOnly;
  const filter = {};

  if (storefrontOnly) {
    filter.isActive = { $ne: false };
    filter.productStatus = { $ne: "inactive" };
  }

  const categoryId = query.categoryId;
  if (categoryId != null && String(categoryId).trim()) {
    const ids = String(categoryId)
      .split(",")
      .map((x) => x.trim())
      .filter((id) => validateObjectId(id));
    if (ids.length === 1) filter.categoryId = new mongoose.Types.ObjectId(ids[0]);
    else if (ids.length > 1) filter.categoryId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const searchRaw = query.search ?? query.q;
  if (searchRaw != null && String(searchRaw).trim()) {
    const t = String(searchRaw).trim().slice(0, 120);
    if (t.length > 0) {
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const codeNorm = t.replace(/\s+/g, "").toUpperCase();
      const looksLikeProductCode = /^[A-Z0-9][A-Z0-9_-]*$/.test(codeNorm) && codeNorm.length <= 40;
      if (looksLikeProductCode) {
        filter.$or = [{ productCode: codeNorm }, { productName: rx }, { slug: rx }, { productCode: rx }];
      } else {
        filter.$or = [{ productName: rx }, { slug: rx }, { productCode: rx }];
      }
    }
  }

  const brandParam = query.brandId;
  if (brandParam != null && String(brandParam).trim()) {
    const ids = String(brandParam)
      .split(",")
      .map((x) => x.trim())
      .filter((id) => validateObjectId(id));
    if (ids.length === 1) filter.brandId = new mongoose.Types.ObjectId(ids[0]);
    else if (ids.length > 1) filter.brandId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const minPrice = query.minPrice != null && query.minPrice !== "" ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice != null && query.maxPrice !== "" ? Number(query.maxPrice) : null;
  if ((minPrice != null && Number.isFinite(minPrice)) || (maxPrice != null && Number.isFinite(maxPrice))) {
    filter.price = {};
    if (minPrice != null && Number.isFinite(minPrice)) filter.price.$gte = minPrice;
    if (maxPrice != null && Number.isFinite(maxPrice)) filter.price.$lte = maxPrice;
  }

  const minRating = query.minRating != null && query.minRating !== "" ? Number(query.minRating) : null;
  if (minRating != null && Number.isFinite(minRating) && minRating > 0) {
    filter.averageRating = { $gte: minRating };
  }

  const sortStr = String(query.sort || "").toLowerCase().trim();
  const saleOnly = query.saleOnly === "true" || query.saleOnly === "1";
  const needSaleExpr = sortStr === "hot_deal" || saleOnly;
  if (needSaleExpr) {
    filter.$expr = { $gt: ["$compareAtPrice", "$price"] };
  }

  return { filter, sort: parseSortKey(query.sort) };
}

async function loadPrimaryMediaUrlByProductIds(productIds) {
  const map = new Map();
  if (!productIds?.length) return map;
  const oid = productIds.map((id) => new mongoose.Types.ObjectId(String(id)));
  const rows = await ProductMedia.aggregate([
    { $match: { productId: { $in: oid } } },
    { $sort: { isPrimary: -1, sortOrder: 1, createdAt: 1 } },
    {
      $group: {
        _id: "$productId",
        mediaUrl: { $first: "$mediaUrl" },
      },
    },
  ]);
  for (const r of rows) {
    if (r.mediaUrl) map.set(String(r._id), r.mediaUrl);
  }
  return map;
}

function resolveListingSelect(listingProfile) {
  const p = String(listingProfile || "").toLowerCase().trim();
  return p === "card" ? PRODUCT_LISTING_FIELDS_CARD : PRODUCT_LISTING_FIELDS;
}

/**
 * @param {{ filter?: object; sort?: object; skip?: number; limit?: number | null; listingProfile?: string }} args
 * `limit: null` = no limit (legacy list-all).
 */
async function queryListingProducts({ filter = {}, sort = { createdAt: -1 }, skip = 0, limit = null, listingProfile }) {
  const selectFields = resolveListingSelect(listingProfile);
  let q = Product.find(filter)
    .select(selectFields)
    .populate("brandId", "brandName brandCode")
    .populate("categoryId", "categoryName categoryCode")
    .sort(sort)
    .skip(Math.max(0, skip))
    .lean();

  if (limit != null && Number.isFinite(limit)) {
    q = q.limit(limit);
  }

  const rows = await q;
  const mediaMap = await loadPrimaryMediaUrlByProductIds(rows.map((p) => p._id));

  return rows.map((p) => {
    const o = { ...p };
    const id = String(p._id);
    if (!o.imageUrl && mediaMap.has(id)) o.imageUrl = mediaMap.get(id);
    return o;
  });
}

module.exports = {
  PRODUCT_LISTING_FIELDS,
  PRODUCT_LISTING_FIELDS_CARD,
  resolveListingSelect,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePaginationParams,
  parseCatalogPagination,
  buildMongoFilterFromQuery,
  parseSortKey,
  loadPrimaryMediaUrlByProductIds,
  queryListingProducts,
};
