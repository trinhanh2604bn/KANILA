const ReviewMedia = require("../models/reviewMedia.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllReviewMedia = async (req, res) => {
  try {
    const media = await ReviewMedia.find().populate("reviewId", "reviewTitle rating").sort({ sortOrder: 1 });
    res.status(200).json({ success: true, message: "Get all review media successfully", count: media.length, data: media });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const media = await ReviewMedia.findById(id).populate("reviewId", "reviewTitle rating");
    if (!media) return res.status(404).json({ success: false, message: "Review media not found" });
    res.status(200).json({ success: true, message: "Get review media successfully", data: media });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getMediaByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!validateObjectId(reviewId)) return res.status(400).json({ success: false, message: "Invalid review ID" });
    const media = await ReviewMedia.find({ reviewId }).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, message: "Get media by review successfully", count: media.length, data: media });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReviewMedia = async (req, res) => {
  try {
    const { reviewId, mediaUrl } = req.body;
    if (!reviewId || !mediaUrl) return res.status(400).json({ success: false, message: "reviewId and mediaUrl are required" });
    const media = await ReviewMedia.create(req.body);
    res.status(201).json({ success: true, message: "Review media created successfully", data: media });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteReviewMedia = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const media = await ReviewMedia.findByIdAndDelete(id);
    if (!media) return res.status(404).json({ success: false, message: "Review media not found" });
    res.status(200).json({ success: true, message: "Review media deleted successfully", data: media });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReviewMedia, getReviewMediaById, getMediaByReviewId, createReviewMedia, deleteReviewMedia };
