const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Brand = require("../models/brand.model");
const ReviewSummary = require("../models/reviewSummary.model");
const { loadCatalogFacetBundleData } = require("../services/catalogStorefrontFacets.service");
const {
  parseCatalogPagination,
  buildMongoFilterFromQuery,
  queryListingProducts,
} = require("../utils/productListingHelpers");

function parseIncludeFlags(query) {
  const raw = query.include;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { categories: true, brands: true };
  }
  const parts = String(raw)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.includes("none")) return { categories: false, brands: false };
  return {
    categories: parts.includes("categories"),
    brands: parts.includes("brands"),
  };
}

async function loadCategoriesMinimal() {
  return Category.find()
    .select("categoryName categoryCode parentCategoryId displayOrder categoryStatus isActive")
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean();
}

async function loadBrandsMinimal() {
  return Brand.find()
    .select("brandName brandCode logoUrl brandStatus isActive")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * GET /api/catalog
 * Bundles minimal categories, brands, paginated products (storefront-visible), and review rows for the page.
 * Additive only — does not replace existing granular routes.
 */
const getCatalogBundle = async (req, res) => {
  try {
    const { page, limit, skip } = parseCatalogPagination(req.query);
    const include = parseIncludeFlags(req.query);
    const { filter, sort } = buildMongoFilterFromQuery(req.query, { storefrontOnly: true });
    const listingProfile = String(req.query.fields || "").toLowerCase().trim() === "card" ? "card" : "full";

    const productsTask = (async () => {
      const [total, items] = await Promise.all([
        Product.countDocuments(filter),
        queryListingProducts({ filter, sort, skip, limit, listingProfile }),
      ]);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return { items, total, page, limit, totalPages };
    })();

    const categoriesTask = include.categories ? loadCategoriesMinimal() : Promise.resolve(null);
    const brandsTask = include.brands ? loadBrandsMinimal() : Promise.resolve(null);

    const [productPage, categories, brands] = await Promise.all([productsTask, categoriesTask, brandsTask]);

    const productIds = productPage.items.map((p) => p._id);
    const reviewSummaries =
      productIds.length > 0
        ? await ReviewSummary.find({ productId: { $in: productIds } })
            .select("productId averageRating reviewCount")
            .lean()
        : [];

    return res.status(200).json({
      success: true,
      message: "Catalog bundle",
      data: {
        categories: categories ?? [],
        brands: brands ?? [],
        products: {
          items: productPage.items,
          total: productPage.total,
          page: productPage.page,
          limit: productPage.limit,
          totalPages: productPage.totalPages,
        },
        reviewSummaries,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/catalog/facets
 * Single response with storefront-scoped facet tables (same data as parallel GETs with `storefrontOnly=1`).
 * Additive — does not replace granular routes. Optional query params (categoryId, brandId, search) reserved
 * for future scoped facet subsets; currently ignored to match global facet dropdown behavior.
 */
const getCatalogFacets = async (req, res) => {
  try {
    const data = await loadCatalogFacetBundleData();
    return res.status(200).json({
      success: true,
      message: "Catalog facet bundle",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/catalog/shades
 * Distinct shades from `Product.shades` with their hex + name (for UI swatches).
 */
const getDistinctShades = async (req, res) => {
  try {
    const rows = await Product.aggregate([
      { $unwind: "$shades" },
      {
        $match: {
          "shades.hex": { $type: "string", $ne: "" },
          "shades.name": { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: "$shades.hex",
          name: { $first: "$shades.name" },
        },
      },
      { $project: { _id: 0, hex: "$_id", name: 1 } },
      { $sort: { name: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Distinct shades",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/catalog/skin-types
 * Distinct skin-type values from `Product.skin_types_supported` (for multi-select chips).
 */
const getDistinctSkinTypes = async (req, res) => {
  try {
    const rows = await Product.aggregate([
      { $unwind: "$skin_types_supported" },
      {
        $match: {
          skin_types_supported: { $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: "$skin_types_supported",
        },
      },
      { $project: { _id: 0, value: "$_id" } },
      { $sort: { value: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      message: "Distinct skin types",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCatalogBundle,
  getCatalogFacets,
  getDistinctShades,
  getDistinctSkinTypes,
};
