/**
 * Storefront-scoped facet table loaders (shared by granular routes with `storefrontOnly=1`
 * and by GET /api/catalog/facets single-flight bundle).
 */
const ProductAttribute = require("../models/productAttribute.model");
const ProductOption = require("../models/productOption.model");
const ProductOptionValue = require("../models/productOptionValue.model");
const ProductVariant = require("../models/productVariant.model");
const Product = require("../models/product.model");
const ReviewSummary = require("../models/reviewSummary.model");
const InventoryBalance = require("../models/inventoryBalance.model");
const Promotion = require("../models/promotion.model");
const { storefrontProductLookupPipeline } = require("../utils/storefrontFacetScope");

async function loadProductAttributesStorefront() {
  return ProductAttribute.aggregate([
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    { $project: { productId: 1, attributeName: 1, attributeValue: 1, displayOrder: 1, createdAt: 1 } },
    { $sort: { displayOrder: 1, createdAt: -1 } },
  ]);
}

async function loadProductOptionsStorefront() {
  return ProductOption.aggregate([
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    { $project: { productId: 1, optionName: 1, displayOrder: 1, createdAt: 1 } },
    { $sort: { displayOrder: 1, createdAt: -1 } },
  ]);
}

async function loadProductOptionValuesStorefront() {
  return ProductOptionValue.aggregate([
    {
      $lookup: {
        from: ProductOption.collection.name,
        localField: "productOptionId",
        foreignField: "_id",
        as: "opt",
      },
    },
    { $unwind: "$opt" },
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$opt.productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    {
      $project: {
        productOptionId: { _id: "$opt._id", optionName: "$opt.optionName", productId: "$opt.productId" },
        optionValue: 1,
        displayOrder: 1,
        createdAt: 1,
      },
    },
    { $sort: { displayOrder: 1, createdAt: -1 } },
  ]);
}

async function loadProductVariantsStorefront() {
  return ProductVariant.aggregate([
    { $match: { variantStatus: { $ne: "inactive" } } },
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    { $project: { productId: 1, sku: 1, variantName: 1, volumeMl: 1, weightGrams: 1, createdAt: 1 } },
    { $sort: { createdAt: -1 } },
  ]);
}

async function loadReviewSummariesStorefront() {
  return ReviewSummary.aggregate([
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    { $project: { productId: 1, averageRating: 1, createdAt: 1 } },
    { $sort: { createdAt: -1 } },
  ]);
}

async function loadInventoryBalancesStorefront() {
  return InventoryBalance.aggregate([
    {
      $lookup: {
        from: ProductVariant.collection.name,
        localField: "variantId",
        foreignField: "_id",
        as: "v",
      },
    },
    { $unwind: "$v" },
    { $match: { "v.variantStatus": { $ne: "inactive" } } },
    {
      $lookup: {
        from: Product.collection.name,
        let: { pid: "$v.productId" },
        pipeline: storefrontProductLookupPipeline(),
        as: "_sf",
      },
    },
    { $match: { "_sf.0": { $exists: true } } },
    { $project: { variantId: 1, availableQty: 1, onHandQty: 1, reservedQty: 1, blockedQty: 1, createdAt: 1 } },
    { $sort: { createdAt: -1 } },
  ]);
}

async function loadPromotionsStorefrontActiveWindow() {
  const now = new Date();
  return Promotion.find({
    promotionStatus: "active",
    startAt: { $lte: now },
    $or: [{ endAt: null }, { endAt: { $exists: false } }, { endAt: { $gte: now } }],
  })
    .select("promotionStatus startAt endAt priority")
    .sort({ priority: -1, createdAt: -1 })
    .lean();
}

/**
 * One round-trip payload for catalog facet UI (parallel DB work, single HTTP response).
 */
async function loadCatalogFacetBundleData() {
  const [attributes, options, optionValues, variants, reviewSummaries, inventoryBalances, activePromotions] =
    await Promise.all([
      loadProductAttributesStorefront(),
      loadProductOptionsStorefront(),
      loadProductOptionValuesStorefront(),
      loadProductVariantsStorefront(),
      loadReviewSummariesStorefront(),
      loadInventoryBalancesStorefront(),
      loadPromotionsStorefrontActiveWindow(),
    ]);

  return {
    attributes,
    options,
    optionValues,
    variants,
    reviewSummaries,
    inventoryBalances,
    activePromotions,
    hasActiveSystemPromotion: activePromotions.length > 0,
  };
}

module.exports = {
  loadProductAttributesStorefront,
  loadProductOptionsStorefront,
  loadProductOptionValuesStorefront,
  loadProductVariantsStorefront,
  loadReviewSummariesStorefront,
  loadInventoryBalancesStorefront,
  loadPromotionsStorefrontActiveWindow,
  loadCatalogFacetBundleData,
};
