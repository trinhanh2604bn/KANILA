const ReviewSummary = require("../models/reviewSummary.model");
const validateObjectId = require("../utils/validateObjectId");

const getAllReviewSummaries = async (req, res) => {
  try {
    const summaries = await ReviewSummary.find().populate("productId", "productName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all review summaries successfully", count: summaries.length, data: summaries });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewSummaryById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const summary = await ReviewSummary.findById(id).populate("productId", "productName");
    if (!summary) return res.status(404).json({ success: false, message: "Review summary not found" });
    res.status(200).json({ success: true, message: "Get review summary successfully", data: summary });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getSummaryByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const summary = await ReviewSummary.findOne({ productId });
    if (!summary) return res.status(404).json({ success: false, message: "Review summary not found for this product" });
    res.status(200).json({ success: true, message: "Get summary by product successfully", data: summary });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReviewSummary = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const summary = await ReviewSummary.create(req.body);
    res.status(201).json({ success: true, message: "Review summary created successfully", data: summary });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: "Summary already exists for this product" });
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteReviewSummary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const summary = await ReviewSummary.findByIdAndDelete(id);
    if (!summary) return res.status(404).json({ success: false, message: "Review summary not found" });
    res.status(200).json({ success: true, message: "Review summary deleted successfully", data: summary });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReviewSummaries, getReviewSummaryById, getSummaryByProductId, createReviewSummary, deleteReviewSummary };
