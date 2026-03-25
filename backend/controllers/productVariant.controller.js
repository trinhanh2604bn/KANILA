const ProductVariant = require("../models/productVariant.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");
const { parseStorefrontFacetFlag } = require("../utils/storefrontFacetScope");
const { loadProductVariantsStorefront } = require("../services/catalogStorefrontFacets.service");

// GET /api/product-variants (catalog stock/size facets — variant refs only)
// Optional `storefrontOnly=1`: active variants for storefront-visible products only.
const getAllProductVariants = async (req, res) => {
  try {
    let variants;
    if (parseStorefrontFacetFlag(req.query)) {
      variants = await loadProductVariantsStorefront();
    } else {
      variants = await ProductVariant.find()
        .select("productId sku variantName volumeMl weightGrams")
        .sort({ createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      message: "Get all product variants successfully",
      count: variants.length,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-variants/:id
const getProductVariantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const variant = await ProductVariant.findById(id).populate("productId", "productName productCode");

    if (!variant) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get product variant successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-variants/product/:productId
const getVariantsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const variants = await ProductVariant.find({ productId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get variants by product successfully",
      count: variants.length,
      data: variants,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/product-variants
const createProductVariant = async (req, res) => {
  try {
    const { productId, sku, variantName } = req.body;

    if (!productId || !sku || !variantName) {
      return res.status(400).json({
        success: false,
        message: "productId, sku, and variantName are required",
      });
    }

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    // Verify product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variant = await ProductVariant.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product variant created successfully",
      data: variant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/product-variants/:id
const updateProductVariant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const variant = await ProductVariant.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product variant updated successfully",
      data: variant,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/product-variants/:id
const deleteProductVariant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const variant = await ProductVariant.findByIdAndDelete(id);

    if (!variant) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product variant deleted successfully",
      data: variant,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductVariants,
  getProductVariantById,
  getVariantsByProductId,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
};
