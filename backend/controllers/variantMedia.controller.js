const VariantMedia = require("../models/variantMedia.model");
const ProductVariant = require("../models/productVariant.model");
const validateObjectId = require("../utils/validateObjectId");

// GET /api/variant-media
const getAllVariantMedia = async (req, res) => {
  try {
    const media = await VariantMedia.find()
      .populate("variantId", "sku variantName")
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get all variant media successfully",
      count: media.length,
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/variant-media/:id
const getVariantMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const media = await VariantMedia.findById(id).populate("variantId", "sku variantName");

    if (!media) {
      return res.status(404).json({ success: false, message: "Variant media not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get variant media successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/variant-media/variant/:variantId
const getMediaByVariantId = async (req, res) => {
  try {
    const { variantId } = req.params;

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variant ID" });
    }

    const media = await VariantMedia.find({ variantId }).sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Get media by variant successfully",
      count: media.length,
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/variant-media
const createVariantMedia = async (req, res) => {
  try {
    const { variantId, mediaUrl, isPrimary } = req.body;

    if (!variantId || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "variantId and mediaUrl are required",
      });
    }

    if (!validateObjectId(variantId)) {
      return res.status(400).json({ success: false, message: "Invalid variantId" });
    }

    const variantExists = await ProductVariant.findById(variantId);
    if (!variantExists) {
      return res.status(404).json({ success: false, message: "Product variant not found" });
    }

    // If isPrimary, unset other primary media for this variant
    if (isPrimary === true) {
      await VariantMedia.updateMany(
        { variantId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const media = await VariantMedia.create(req.body);

    res.status(201).json({
      success: true,
      message: "Variant media created successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/variant-media/:id
const updateVariantMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPrimary } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const existingMedia = await VariantMedia.findById(id);
    if (!existingMedia) {
      return res.status(404).json({ success: false, message: "Variant media not found" });
    }

    // If setting as primary, unset others
    if (isPrimary === true) {
      await VariantMedia.updateMany(
        { variantId: existingMedia.variantId, _id: { $ne: id }, isPrimary: true },
        { isPrimary: false }
      );
    }

    const media = await VariantMedia.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Variant media updated successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/variant-media/:id
const deleteVariantMedia = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid media ID" });
    }

    const media = await VariantMedia.findByIdAndDelete(id);

    if (!media) {
      return res.status(404).json({ success: false, message: "Variant media not found" });
    }

    res.status(200).json({
      success: true,
      message: "Variant media deleted successfully",
      data: media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllVariantMedia,
  getVariantMediaById,
  getMediaByVariantId,
  createVariantMedia,
  updateVariantMedia,
  deleteVariantMedia,
};
