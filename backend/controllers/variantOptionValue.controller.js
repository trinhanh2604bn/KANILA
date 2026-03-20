const VariantOptionValue = require("../models/variantOptionValue.model");
const ProductVariant = require("../models/productVariant.model");
const ProductOptionValue = require("../models/productOptionValue.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/variant-option-values
const getAllVariantOptionValues = async (req, res) => {
  try {
    const values = await VariantOptionValue.find()
      .populate("variantId", "sku variantName")
      .populate({
        path: "productOptionValueId",
        select: "optionValue productOptionId",
        populate: { path: "productOptionId", select: "optionName" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all variant option values successfully",
      count: values.length,
      data: values,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/variant-option-values/:id
const getVariantOptionValueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const value = await VariantOptionValue.findById(id)
      .populate("variantId", "sku variantName")
      .populate({
        path: "productOptionValueId",
        select: "optionValue productOptionId",
        populate: { path: "productOptionId", select: "optionName" },
      });

    if (!value) {
      return res.status(404).json({ success: false, message: "Variant option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get variant option value successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/variant-option-values/variant/:variantId
const getValuesByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const values = await VariantOptionValue.find({ variantId })
      .populate({
        path: "productOptionValueId",
        select: "optionValue productOptionId",
        populate: { path: "productOptionId", select: "optionName" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get option values by variant successfully",
      count: values.length,
      data: values,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/variant-option-values
const createVariantOptionValue = async (req, res) => {
  try {
    const { variantId, productOptionValueId } = req.body;

    if (!variantId || !productOptionValueId) {
      return res.status(400).json({
        success: false,
        message: "variantId and productOptionValueId are required",
      });
    }

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }
    if (!validateObjectId(productOptionValueId)) {
      return res.status(400).json({ success: false, message: "Invalid productOptionValueId" });
    }

    // Verify variant exists
    const variantExists = await ProductVariant.findById(variantId);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    // Verify product option value exists
    const optionValueExists = await ProductOptionValue.findById(productOptionValueId);
    if (!optionValueExists) {
      return res.status(404).json({ success: false, message: "Product option value not found" });
    }

    const value = await VariantOptionValue.create(req.body);

    res.status(201).json({
      success: true,
      message: "Variant option value created successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/variant-option-values/:id
const updateVariantOptionValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { variantId, productOptionValueId } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Verify references if being updated
    if (variantId) {
      if (!validateObjectId(variantId)) {
        return res.status(400).json({ success: false, message: "Invalid variantId" });
      }
      const variantExists = await ProductVariant.findById(variantId);
      if (!variantExists) {
        return res.status(404).json({ success: false, message: "Product variant not found" });
      }
    }

    if (productOptionValueId) {
      if (!validateObjectId(productOptionValueId)) {
        return res.status(400).json({ success: false, message: "Invalid productOptionValueId" });
      }
      const optionValueExists = await ProductOptionValue.findById(productOptionValueId);
      if (!optionValueExists) {
        return res.status(404).json({ success: false, message: "Product option value not found" });
      }
    }

    const value = await VariantOptionValue.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!value) {
      return res.status(404).json({ success: false, message: "Variant option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Variant option value updated successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/variant-option-values/:id
const deleteVariantOptionValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const value = await VariantOptionValue.findByIdAndDelete(id);

    if (!value) {
      return res.status(404).json({ success: false, message: "Variant option value not found" });
    }

    res.status(200).json({
      success: true,
      message: "Variant option value deleted successfully",
      data: value,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllVariantOptionValues,
  getVariantOptionValueById,
  getValuesByVariantId,
  createVariantOptionValue,
  updateVariantOptionValue,
  deleteVariantOptionValue,
};
