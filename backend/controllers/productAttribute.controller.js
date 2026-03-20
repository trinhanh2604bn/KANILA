const ProductAttribute = require("../models/productAttribute.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/product-attributes
const getAllProductAttributes = async (req, res) => {
  try {
    const attributes = await ProductAttribute.find()
      .populate("productId", "productName productCode")
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all product attributes successfully",
      count: attributes.length,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-attributes/:id
const getProductAttributeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid attribute ID" });
    }

    const attribute = await ProductAttribute.findById(id).populate("productId", "productName productCode");

    if (!attribute) {
      return res.status(404).json({ success: false, message: "Product attribute not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get product attribute successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-attributes/product/:productId
const getAttributesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const attributes = await ProductAttribute.find({ productId }).sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      message: "Get attributes by product successfully",
      count: attributes.length,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/product-attributes
const createProductAttribute = async (req, res) => {
  try {
    const { productId, attributeName } = req.body;

    if (!productId || !attributeName) {
      return res.status(400).json({
        success: false,
        message: "productId and attributeName are required",
      });
    }

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const attribute = await ProductAttribute.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product attribute created successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/product-attributes/:id
const updateProductAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid attribute ID" });
    }

    const attribute = await ProductAttribute.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!attribute) {
      return res.status(404).json({ success: false, message: "Product attribute not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product attribute updated successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/product-attributes/:id
const deleteProductAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid attribute ID" });
    }

    const attribute = await ProductAttribute.findByIdAndDelete(id);

    if (!attribute) {
      return res.status(404).json({ success: false, message: "Product attribute not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product attribute deleted successfully",
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductAttributes,
  getProductAttributeById,
  getAttributesByProductId,
  createProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
};
