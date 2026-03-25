const Review = require("../models/review.model");
const ReviewSummary = require("../models/reviewSummary.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const validateObjectId = require("../utils/validateObjectId");

const CUST = "customer_code full_name avatar_url";

const isAdminAccount = (req) => {
  const t = String(req.user?.account_type || req.user?.accountType || "").toLowerCase();
  return t === "admin" || t === "staff";
};

// Helper: materialized summary sync (approved reviews only)
const recalcReviewSummary = async (productId) => {
  const reviews = await Review.find({ productId, reviewStatus: "approved" });
  const reviewCount = reviews.length;
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  reviews.forEach((r) => {
    ratingCounts[r.rating]++;
    totalRating += r.rating;
  });

  const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

  await ReviewSummary.findOneAndUpdate(
    { productId },
    {
      reviewCount,
      averageRating,
      rating1Count: ratingCounts[1],
      rating2Count: ratingCounts[2],
      rating3Count: ratingCounts[3],
      rating4Count: ratingCounts[4],
      rating5Count: ratingCounts[5],
    },
    { upsert: true, new: true }
  );
};

// GET /api/admin/reviews/pending?productId=&rating=&page=&limit=
const getPendingReviews = async (req, res) => {
  try {
    if (!isAdminAccount(req)) return res.status(403).json({ success: false, message: "Forbidden" });

    const { productId, rating, page, limit } = req.query;
    const pageNum = Math.max(1, Number(page || 1));
    const pageSize = Math.min(60, Math.max(1, Number(limit || 20)));
    const skip = (pageNum - 1) * pageSize;

    const filter = { reviewStatus: "pending" };
    if (productId && String(productId).trim()) {
      if (!validateObjectId(productId)) return res.status(400).json({ success: false, message: "Invalid productId" });
      filter.productId = productId;
    }
    if (rating != null && String(rating).trim()) {
      const r = Number(rating);
      if (![1, 2, 3, 4, 5].includes(r)) return res.status(400).json({ success: false, message: "Invalid rating" });
      filter.rating = r;
    }

    const reviews = await Review.find(filter)
      .populate("customer_id", CUST)
      .populate("productId", "productName imageUrl")
      .populate("variantId", "variantName sku")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.status(200).json({
      success: true,
      message: "Pending reviews retrieved",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/reviews/:id/approve
const approveReview = async (req, res) => {
  try {
    if (!isAdminAccount(req)) return res.status(403).json({ success: false, message: "Forbidden" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid review id" });

    const adminAccountId = req.user?.account_id || req.user?.accountId;
    if (!adminAccountId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.reviewStatus = "approved";
    review.adminNote = req.body?.adminNote ?? review.adminNote ?? "";
    review.approvedByAccountId = adminAccountId;
    review.approvedAt = new Date();

    await review.save();
    await recalcReviewSummary(review.productId);

    res.status(200).json({ success: true, message: "Review approved", data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/reviews/:id/reject
const rejectReview = async (req, res) => {
  try {
    if (!isAdminAccount(req)) return res.status(403).json({ success: false, message: "Forbidden" });

    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid review id" });

    const adminAccountId = req.user?.account_id || req.user?.accountId;
    if (!adminAccountId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.reviewStatus = "rejected";
    review.adminNote = req.body?.adminNote ?? review.adminNote ?? "";
    review.approvedByAccountId = null;
    review.approvedAt = null;

    await review.save();
    await recalcReviewSummary(review.productId);

    res.status(200).json({ success: true, message: "Review rejected", data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPendingReviews, approveReview, rejectReview };

