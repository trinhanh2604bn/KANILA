const ProductMedia = require("../models/productMedia.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/product-media
const getAllProductMedia = async (req, res) => {
  try {
    const media = await ProductMedia.find()
      .populate("productId", "productName productCode")
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all product media successfully",
      count: media.length,
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-media/:id
const getProductMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const media = await ProductMedia.findById(id).populate("productId", "productName productCode");

    if (!media) {
      return res.status(404).json({ success: false, message: "Product media not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get product media successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/product-media/product/:productId
const getMediaByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const media = await ProductMedia.find({ productId }).sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get media by product successfully",
      count: media.length,
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/product-media
const createProductMedia = async (req, res) => {
  try {
    const { productId, mediaUrl, isPrimary } = req.body;

    if (!productId || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "productId and mediaUrl are required",
      });
    }

    if (!validateObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // If isPrimary, unset other primary media for this product
    if (isPrimary === true) {
      await ProductMedia.updateMany(
        { productId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const media = await ProductMedia.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product media created successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/product-media/:id
const updateProductMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPrimary } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const existingMedia = await ProductMedia.findById(id);
    if (!existingMedia) {
      return res.status(404).json({ success: false, message: "Product media not found" });
    }

    // If setting as primary, unset others
    if (isPrimary === true) {
      await ProductMedia.updateMany(
        { productId: existingMedia.productId, _id: { $ne: id }, isPrimary: true },
        { isPrimary: false }
      );
    }

    const media = await ProductMedia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Product media updated successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/product-media/:id
const deleteProductMedia = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const media = await ProductMedia.findByIdAndDelete(id);

    if (!media) {
      return res.status(404).json({ success: false, message: "Product media not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product media deleted successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProductMedia,
  getProductMediaById,
  getMediaByProductId,
  createProductMedia,
  updateProductMedia,
  deleteProductMedia,
};
