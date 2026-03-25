const Category = require("../models/category.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/categories (tree + header: ids, names, parent ref — no heavy description join)
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .select("categoryName categoryCode parentCategoryId displayOrder categoryStatus isActive")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Get all categories successfully",
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const category = await Category.findById(id).populate(
      "parentCategoryId",
      "categoryName categoryCode"
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get category successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { categoryName, categoryCode, parentCategoryId } = req.body;

    if (!categoryName || !categoryCode) {
      return res.status(400).json({
        success: false,
        message: "categoryName and categoryCode are required",
      });
    }

    // Verify parent category exists if provided
    if (parentCategoryId) {
      if (!validateObjectId(parentCategoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parentCategoryId",
        });
      }

      const parentExists = await Category.findById(parentCategoryId);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { parentCategoryId } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    // Verify parent category exists if provided
    if (parentCategoryId) {
      if (!validateObjectId(parentCategoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid parentCategoryId",
        });
      }

      const parentExists = await Category.findById(parentCategoryId);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    const category = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category code already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
