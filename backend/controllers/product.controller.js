const mongoose = require("mongoose");
const Product = require("../models/product.model");
const ProductMedia = require("../models/productMedia.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");
const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");

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
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("brandId", "brandName brandCode")
      .populate("categoryId", "categoryName categoryCode")
      .sort({ createdAt: -1 });

    const ids = products.map((p) => p._id);
    let firstMediaByProduct = new Map();
    if (ids.length) {
      const mediaRows = await ProductMedia.find({ productId: { $in: ids } })
        .sort({ isPrimary: -1, sortOrder: 1, createdAt: 1 })
        .lean();
      for (const m of mediaRows) {
        const key = String(m.productId);
        if (!firstMediaByProduct.has(key)) firstMediaByProduct.set(key, m.mediaUrl);
      }
    }

    const data = products.map((p) => {
      const o = p.toObject ? p.toObject() : { ...p };
      const id = String(p._id);
      if (!o.imageUrl && firstMediaByProduct.has(id)) {
        o.imageUrl = firstMediaByProduct.get(id);
      }
      return o;
    });

    res.status(200).json({
      success: true,
      message: "Get all products successfully",
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
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

    // Sanitize slug and productCode: if they are empty strings, remove them 
    // to allow MongoDB sparse index to skip them (preventing duplicate "" keys).
    if (req.body.slug === "") delete req.body.slug;
    if (req.body.productCode === "") delete req.body.productCode;

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

    // Sanitize slug and productCode: if they are empty strings, remove them 
    // to allow MongoDB sparse index to skip them (preventing duplicate "" keys).
    if (req.body.slug === "") delete req.body.slug;
    if (req.body.productCode === "") delete req.body.productCode;

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
    
    // Sanitize slug and productCode
    if (updates.slug === "") delete updates.slug;
    if (updates.productCode === "") delete updates.productCode;

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
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
};
