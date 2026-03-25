const mongoose = require("mongoose");
const Product = require("../models/product.model");
const ProductMedia = require("../models/productMedia.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");
const { parsePaginationParams, buildMongoFilterFromQuery, queryListingProducts } = require("../utils/productListingHelpers");
const {
  PRODUCT_DETAIL_CORE_SELECT,
  isProductDetailCoreQuery,
  attachProductDetailCoreMedia,
} = require("../utils/productDetailCoreFields");

/** Attach `{ email }` from Account without `.populate()` (avoids strictPopulate when paths/cache disagree). */
async function attachAuditAccountEmails(data, productDoc) {
  let raw = null;
  try {
    raw = await Product.collection.findOne({ _id: new mongoose.Types.ObjectId(String(productDoc._id)) });
  } catch {
    raw = null;
  }
  for (const field of ["createdByAccountId", "updatedByAccountId"]) {
    const cur = data[field];
    if (cur && typeof cur === "object" && cur.email) continue;
    const idVal = cur ?? raw?.[field];
    if (!idVal) continue;
    const acc = await Account.findById(idVal).select("email").lean();
    if (acc) data[field] = acc;
  }
}

// GET /api/products
// - Without `page` query: legacy full list (same shape as Phase 1; no server-side filters).
// - With `page`: paginated + optional filters categoryId, brandId (comma-sep), minPrice, maxPrice, minRating, sort.
const getAllProducts = async (req, res) => {
  try {
    const pag = parsePaginationParams(req.query);
    const listingProfile = String(req.query.fields || "").toLowerCase().trim() === "card" ? "card" : "full";

    if (!pag.enabled) {
      const data = await queryListingProducts({
        filter: {},
        sort: { createdAt: -1 },
        skip: 0,
        limit: null,
        listingProfile,
      });
      return res.status(200).json({
        success: true,
        message: "Get all products successfully",
        count: data.length,
        data,
      });
    }

    // Storefront listing should not return inactive products.
    // (Existing Angular catalog historically filtered out inactive on the client.)
    const { filter, sort } = buildMongoFilterFromQuery(req.query, { storefrontOnly: true });
    const skip = (pag.page - 1) * pag.limit;
    const [total, data] = await Promise.all([
      Product.countDocuments(filter),
      queryListingProducts({ filter, sort, skip, limit: pag.limit, listingProfile }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pag.limit));

    return res.status(200).json({
      success: true,
      message: "Get products successfully",
      count: data.length,
      total,
      page: pag.page,
      limit: pag.limit,
      totalPages,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
// Optional `?fields=core` — lean PDP shell: no long copy / ingredients / audit Account lookups; adds thumbnailUrls from ProductMedia.
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (isProductDetailCoreQuery(req.query.fields)) {
      const doc = await Product.findById(id)
        .select(PRODUCT_DETAIL_CORE_SELECT)
        .populate("brandId", "brandName brandCode")
        .populate("categoryId", "categoryName categoryCode")
        .lean();

      if (!doc) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const data = { ...doc };
      await attachProductDetailCoreMedia(doc._id, data);

      return res.status(200).json({
        success: true,
        message: "Get product successfully",
        data,
      });
    }

    const product = await Product.findById(id)
      .populate("brandId", "brandName brandCode")
      .populate("categoryId", "categoryName categoryCode");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const data = product.toObject ? product.toObject() : product;
    await attachAuditAccountEmails(data, product);
    if (!data.imageUrl) {
      const m = await ProductMedia.findOne({ productId: product._id })
        .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
        .lean();
      if (m?.mediaUrl) data.imageUrl = m.mediaUrl;
    }

    res.status(200).json({
      success: true,
      message: "Get product successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/slug/:slug
// Optional `?fields=core` — same lightweight profile as GET /api/products/:id?fields=core
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || !String(slug).trim()) {
      return res.status(400).json({ success: false, message: "Slug is required" });
    }

    const slugNorm = String(slug).trim().toLowerCase();

    if (isProductDetailCoreQuery(req.query.fields)) {
      const doc = await Product.findOne({ slug: slugNorm })
        .select(PRODUCT_DETAIL_CORE_SELECT)
        .populate("brandId", "brandName brandCode")
        .populate("categoryId", "categoryName categoryCode")
        .lean();

      if (!doc) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const data = { ...doc };
      await attachProductDetailCoreMedia(doc._id, data);

      return res.status(200).json({
        success: true,
        message: "Get product by slug successfully",
        data,
      });
    }

    const product = await Product.findOne({ slug: slugNorm })
      .populate("brandId", "brandName brandCode")
      .populate("categoryId", "categoryName categoryCode");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const data = product.toObject ? product.toObject() : product;
    await attachAuditAccountEmails(data, product);
    if (!data.imageUrl) {
      const m = await ProductMedia.findOne({ productId: product._id })
        .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
        .lean();
      if (m?.mediaUrl) data.imageUrl = m.mediaUrl;
    }

    res.status(200).json({
      success: true,
      message: "Get product by slug successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const { productName, productCode, brandId, categoryId, price, stock, bought } = req.body;

    // Required fields check
    if (!productName || !productCode || !brandId || !categoryId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "productName, productCode, brandId, categoryId, and price are required",
      });
    }

    // Numeric validations
    if (price < 0) {
      return res.status(400).json({ success: false, message: "Price must not be negative" });
    }
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must not be negative" });
    }
    if (bought !== undefined && bought < 0) {
      return res.status(400).json({ success: false, message: "Bought must not be negative" });
    }

    // Validate ObjectId format
    if (!validateObjectId(brandId)) {
      return res.status(400).json({ success: false, message: "Invalid brandId" });
    }
    if (!validateObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }

    // Reference integrity: verify brand and category exist
    const brandExists = await Brand.findById(brandId);
    if (!brandExists) {
      return res.status(404).json({ success: false, message: "Brand not found" });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId, categoryId, price, stock, bought } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Numeric validations (only if provided)
    if (price !== undefined && price < 0) {
      return res.status(400).json({ success: false, message: "Price must not be negative" });
    }
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({ success: false, message: "Stock must not be negative" });
    }
    if (bought !== undefined && bought < 0) {
      return res.status(400).json({ success: false, message: "Bought must not be negative" });
    }

    // Reference integrity checks if updating references
    if (brandId) {
      if (!validateObjectId(brandId)) {
        return res.status(400).json({ success: false, message: "Invalid brandId" });
      }
      const brandExists = await Brand.findById(brandId);
      if (!brandExists) {
        return res.status(404).json({ success: false, message: "Brand not found" });
      }
    }

    if (categoryId) {
      if (!validateObjectId(categoryId)) {
        return res.status(400).json({ success: false, message: "Invalid categoryId" });
      }
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// PATCH /api/products/:id
const patchProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const allowed = ["productStatus", "productName", "basePrice", "compareAtPrice", "categoryId", "brandId", "description", "shortDescription"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("categoryId", "categoryName").populate("brandId", "brandName");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product patched successfully", data: product });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
};
