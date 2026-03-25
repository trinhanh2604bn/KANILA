const ProductMedia = require("../models/productMedia.model");

/**
 * Lightweight product document for PDP first paint (`GET /api/products/... ?fields=core`).
 * Omits long copy, ingredients, usage, and audit refs — smaller BSON/JSON and no Account lookups.
 *
 * Response still uses canonical Product field names (`productName`, `imageUrl`, …) plus additive
 * `primaryImageUrl` and `thumbnailUrls` from ProductMedia (bounded list).
 */
const PRODUCT_DETAIL_CORE_SELECT = [
  "productName",
  "slug",
  "productCode",
  "price",
  "compareAtPrice",
  "imageUrl",
  "shortDescription",
  "averageRating",
  "stock",
  "bought",
  "isActive",
  "productStatus",
  "brandId",
  "categoryId",
  "createdAt",
  "updatedAt",
].join(" ");

function isProductDetailCoreQuery(fields) {
  return String(fields ?? "").toLowerCase().trim() === "core";
}

const CORE_MEDIA_THUMB_LIMIT = 12;

/**
 * Sets `imageUrl` (if missing), `primaryImageUrl`, and `thumbnailUrls` from ProductMedia.
 */
async function attachProductDetailCoreMedia(productId, data) {
  const rows = await ProductMedia.find({ productId })
    .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
    .limit(CORE_MEDIA_THUMB_LIMIT)
    .select("mediaUrl isPrimary sortOrder")
    .lean();
  const urls = rows.map((r) => r.mediaUrl).filter(Boolean);
  if (urls.length) {
    data.primaryImageUrl = urls[0];
    data.thumbnailUrls = urls;
    if (!data.imageUrl) data.imageUrl = urls[0];
  } else {
    data.primaryImageUrl = data.imageUrl || "";
    data.thumbnailUrls = data.imageUrl ? [data.imageUrl] : [];
  }
}

module.exports = {
  PRODUCT_DETAIL_CORE_SELECT,
  isProductDetailCoreQuery,
  attachProductDetailCoreMedia,
  CORE_MEDIA_THUMB_LIMIT,
};
