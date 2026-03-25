const Review = require("../models/review.model");
const ReviewSummary = require("../models/reviewSummary.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

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
    const reviews = await Review.find().populate("customer_id", CUST).populate("productId", "productName").sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all reviews successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const review = await Review.findById(id).populate("customer_id", CUST).populate("productId", "productName").populate("variantId", "sku variantName");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.status(200).json({ success: true, message: "Get review successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid product ID" });
    const reviews = await Review.find({ productId, reviewStatus: "approved" })
      .populate("customer_id", CUST)
      .populate("variantId", "variantName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.status(200).json({ success: true, message: "Get reviews by product successfully", count: reviews.length, data: reviews });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReview = async (req, res) => {
  try {
    const { productId, rating } = req.body;
    const customer_id = pickCustomerId(req.body);
    if (!customer_id || !productId || !rating) return res.status(400).json({ success: false, message: "customer_id, productId, and rating are required" });
    if (!validateObjectId(customer_id)) return res.status(400).json({ success: false, message: "Invalid customer_id" });
    if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });
    const customerExists = await Customer.findById(customer_id);
    if (!customerExists) return res.status(404).json({ success: false, message: "Customer not found" });
    const productExists = await Product.findById(productId);
    if (!productExists) return res.status(404).json({ success: false, message: "Product not found" });

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const review = await Review.create(payload);
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
// PATCH /api/reviews/:id
const patchReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const allowed = ["reviewStatus", "adminNote"];
    const updates = {};
    for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: "No valid fields to update" });
    const review = await Review.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("customer_id", CUST).populate("productId", "productName");
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    await recalcReviewSummary(review.productId);
    res.status(200).json({ success: true, message: "Review patched successfully", data: review });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

module.exports = { getAllReviews, getReviewById, getReviewsByProductId, createReview, updateReview, patchReview, deleteReview };
