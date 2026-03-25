const ProductOptionValue = require("../models/productOptionValue.model");
const ProductOption = require("../models/productOption.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");
const { parseStorefrontFacetFlag } = require("../utils/storefrontFacetScope");
const { loadProductOptionValuesStorefront } = require("../services/catalogStorefrontFacets.service");

// GET /api/product-option-values (catalog: shade labels via option + productId)
// Optional `storefrontOnly=1`: same shape as populate(), scoped to storefront products.
const getAllProductOptionValues = async (req, res) => {
  try {
    let values;
    if (parseStorefrontFacetFlag(req.query)) {
      values = await loadProductOptionValuesStorefront();
    } else {
      values = await ProductOptionValue.find()
        .select("productOptionId optionValue displayOrder")
        .populate("productOptionId", "optionName productId")
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      success: true,
      message: "Get all product option values successfully",
      count: values.length,
      data: values,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-option-values/:id
const getProductOptionValueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option value ID" });
    }

    const value = await ProductOptionValue.findById(id).populate("productOptionId", "optionName");

    if (!value) {
      return res.status(404).json({ success: false, message: "Product option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get product option value successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-option-values/option/:productOptionId
const getValuesByOptionId = async (req, res) => {
  try {
    const { productOptionId } = req.params;

    if (!validateObjectId(productOptionId)) {
      return res.status(400).json({ success: false, message: "Invalid product option ID" });
    }

    const values = await ProductOptionValue.find({ productOptionId }).sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      message: "Get option values by option successfully",
      count: values.length,
      data: values,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/product-option-values
const createProductOptionValue = async (req, res) => {
  try {
    const { productOptionId, optionValue } = req.body;

    if (!productOptionId || !optionValue) {
      return res.status(400).json({
        success: false,
        message: "productOptionId and optionValue are required",
      });
    }

    if (!validateObjectId(productOptionId)) {
      return res.status(400).json({ success: false, message: "Invalid productOptionId" });
    }

    // Verify product option exists
    const optionExists = await ProductOption.findById(productOptionId);
    if (!optionExists) {
      return res.status(404).json({ success: false, message: "Product option not found" });
    }

    const value = await ProductOptionValue.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product option value created successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/product-option-values/:id
const updateProductOptionValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option value ID" });
    }

    const value = await ProductOptionValue.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!value) {
      return res.status(404).json({ success: false, message: "Product option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product option value updated successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/product-option-values/:id
const deleteProductOptionValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option value ID" });
    }

    const value = await ProductOptionValue.findByIdAndDelete(id);

    if (!value) {
      return res.status(404).json({ success: false, message: "Product option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product option value deleted successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductOptionValues,
  getProductOptionValueById,
  getValuesByOptionId,
  createProductOptionValue,
  updateProductOptionValue,
  deleteProductOptionValue,
};
