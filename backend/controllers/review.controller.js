const Review = require("../models/review.model");
const ReviewSummary = require("../models/reviewSummary.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");

// Helper: recalculate review summary for a product
const recalcReviewSummary = async (productId) => {
  const reviews = await Review.find({ productId, reviewStatus: "approved" });
  const reviewCount = reviews.length;
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  reviews.forEach((r) => { ratingCounts[r.rating]++; totalRating += r.rating; });
  const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

  await ReviewSummary.findOneAndUpdate(
    { productId },
    { reviewCount, averageRating, rating1Count: ratingCounts[1], rating2Count: ratingCounts[2], rating3Count: ratingCounts[3], rating4Count: ratingCounts[4], rating5Count: ratingCounts[5] },
    { upsert: true, new: true }
  );
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate("customerId", "customerCode fullName").populate("productId", "productName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all reviews successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const review = await Review.findById(id).populate("customerId", "customerCode fullName").populate("productId", "productName").populate("variantId", "sku variantName");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.status(200).json({ success: true, message: "Get review successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const reviews = await Review.find({ productId }).populate("customerId", "customerCode fullName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get reviews by product successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReview = async (req, res) => {
  try {
    const { customerId, productId, rating } = req.body;
    if (!customerId || !productId || !rating) return res.status(400).json({ success: false, message: "customerId, productId, and rating are required" });
    if (!validateObjectId(customerId)) return res.status(400).json({ success: false, message: "Invalid customerId" });
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });
    const productExists = await Product.findById(productId);
    if (!productExists) return res.status(404).json({ success: false, message: "Product not found" });

    const review = await Review.create(req.body);
    await recalcReviewSummary(productId);
    res.status(201).json({ success: true, message: "Review created successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const existing = await Review.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Review not found" });
    const review = await Review.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review updated successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const review = await Review.findByIdAndDelete(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review deleted successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReviews, getReviewById, getReviewsByProductId, createReview, updateReview, deleteReview };
