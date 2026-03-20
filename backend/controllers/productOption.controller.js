const ProductOption = require("../models/productOption.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/product-options
const getAllProductOptions = async (req, res) => {
  try {
    const options = await ProductOption.find()
      .populate("productId", "productName productCode")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all product options successfully",
      count: options.length,
      data: options,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-options/:id
const getProductOptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option ID" });
    }

    const option = await ProductOption.findById(id).populate("productId", "productName productCode");

    if (!option) {
      return res.status(404).json({ success: false, message: "Product option not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get product option successfully",
      data: option,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-options/product/:productId
const getOptionsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const options = await ProductOption.find({ productId }).sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      message: "Get options by product successfully",
      count: options.length,
      data: options,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/product-options
const createProductOption = async (req, res) => {
  try {
    const { productId, optionName } = req.body;

    if (!productId || !optionName) {
      return res.status(400).json({
        success: false,
        message: "productId and optionName are required",
      });
    }

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const option = await ProductOption.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product option created successfully",
      data: option,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/product-options/:id
const updateProductOption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option ID" });
    }

    const option = await ProductOption.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!option) {
      return res.status(404).json({ success: false, message: "Product option not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product option updated successfully",
      data: option,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/product-options/:id
const deleteProductOption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid option ID" });
    }

    const option = await ProductOption.findByIdAndDelete(id);

    if (!option) {
      return res.status(404).json({ success: false, message: "Product option not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product option deleted successfully",
      data: option,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductOptions,
  getProductOptionById,
  getOptionsByProductId,
  createProductOption,
  updateProductOption,
  deleteProductOption,
};
