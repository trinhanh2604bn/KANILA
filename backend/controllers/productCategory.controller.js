const ProductCategory = require("../models/productCategory.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllProductCategories = async (req, res) => {
  try {
    const rows = await ProductCategory.find()
      .populate("productId", "productName productCode")
      .populate("categoryId", "categoryName categoryCode")
      .sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      message: "Get all product–category links successfully",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const row = await ProductCategory.findById(id)
      .populate("productId", "productName productCode")
      .populate("categoryId", "categoryName categoryCode");
    if (!row) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    res.status(200).json({ success: true, message: "Get link successfully", data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }
    const rows = await ProductCategory.find({ productId })
      .populate("categoryId", "categoryName categoryCode parentCategoryId")
      .sort({ isPrimary: -1, sortOrder: 1 });
    res.status(200).json({
      success: true,
      message: "Get categories for product successfully",
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProductCategory = async (req, res) => {
  try {
    const { productId, categoryId } = req.body;
    if (!productId || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "productId and categoryId are required",
      });
    }
    if (!validateObjectId(productId) || !validateObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid productId or categoryId" });
    }
    const [p, c] = await Promise.all([Product.findById(productId), Category.findById(categoryId)]);
    if (!p) return res.status(404).json({ success: false, message: "Product not found" });
    if (!c) return res.status(404).json({ success: false, message: "Category not found" });

    const row = await ProductCategory.create(req.body);
    res.status(201).json({ success: true, message: "Link created successfully", data: row });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This product is already linked to this category",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const row = await ProductCategory.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!row) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    res.status(200).json({ success: true, message: "Link updated successfully", data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProductCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const row = await ProductCategory.findByIdAndDelete(id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }
    res.status(200).json({ success: true, message: "Link deleted successfully", data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductCategories,
  getProductCategoryById,
  getByProductId,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
};
