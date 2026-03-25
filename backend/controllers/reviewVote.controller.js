const ReviewVote = require("../models/reviewVote.model");
const Review = require("../models/review.model");
const Customer = require("../models/customer.model");
const validateObjectId = require("../utils/validateObjectId");
const { pickCustomerId } = require("../utils/pickCustomerRef");

const CUST = "customer_code full_name";

const getAllReviewVotes = async (req, res) => {
  try {
    const votes = await ReviewVote.find().populate("reviewId", "reviewTitle").populate("customer_id", CUST).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get all review votes successfully", count: votes.length, data: votes });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getReviewVoteById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const vote = await ReviewVote.findById(id).populate("reviewId", "reviewTitle").populate("customer_id", CUST);
    if (!vote) return res.status(404).json({ success: false, message: "Review vote not found" });
    res.status(200).json({ success: true, message: "Get review vote successfully", data: vote });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const getVotesByReviewId = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!validateObjectId(reviewId)) return res.status(400).json({ success: false, message: "Invalid review ID" });
    const votes = await ReviewVote.find({ reviewId }).populate("customer_id", CUST).sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Get votes by review successfully", count: votes.length, data: votes });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const createReviewVote = async (req, res) => {
  try {
    const { reviewId, voteType } = req.body;
    const customer_id = pickCustomerId(req.body);
    if (!reviewId || !customer_id || !voteType) return res.status(400).json({ success: false, message: "reviewId, customer_id, and voteType are required" });

    const payload = { ...req.body, customer_id };
    delete payload.customerId;
    const vote = await ReviewVote.create(payload);

    // Update helpfulCount on the review
    if (voteType === "helpful") {
      await Review.findByIdAndUpdate(reviewId, { $inc: { helpfulCount: 1 } });
    }

    res.status(201).json({ success: true, message: "Review vote created successfully", data: vote });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const deleteReviewVote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
    const vote = await ReviewVote.findByIdAndDelete(id);
    if (!vote) return res.status(404).json({ success: false, message: "Review vote not found" });

    // Decrement helpfulCount if was helpful
    if (vote.voteType === "helpful") {
      await Review.findByIdAndUpdate(vote.reviewId, { $inc: { helpfulCount: -1 } });
    }

    res.status(200).json({ success: true, message: "Review vote deleted successfully", data: vote });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// POST /api/reviews/:reviewId/vote
// Requires auth: server derives customer_id from JWT.
const voteOnReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body;

    if (!validateObjectId(reviewId)) return res.status(400).json({ success: false, message: "Invalid reviewId" });
    if (!voteType || !["helpful", "not_helpful"].includes(voteType)) {
      return res.status(400).json({ success: false, message: "Invalid voteType" });
    }

    const accountId = req.user?.account_id || req.user?.accountId;
    if (!accountId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const customer = await Customer.findOne({ account_id: accountId });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const existingVote = await ReviewVote.findOne({ reviewId, customer_id: customer._id });

    // helpfulCount only changes when switching between helpful <-> not_helpful.
    if (!existingVote) {
      const created = await ReviewVote.create({ reviewId, customer_id: customer._id, voteType });
      if (voteType === "helpful") await Review.findByIdAndUpdate(reviewId, { $inc: { helpfulCount: 1 } });

      const updated = await Review.findById(reviewId);
      return res.status(201).json({ success: true, message: "Vote recorded", data: { reviewId, helpfulCount: updated.helpfulCount, vote: created } });
    }

    if (existingVote.voteType === voteType) {
      return res.status(200).json({
        success: true,
        message: "Vote already recorded",
        data: { reviewId, helpfulCount: review.helpfulCount, vote: existingVote },
      });
    }

    // Switch vote type: helpful -> not_helpful or not_helpful -> helpful
    const delta = existingVote.voteType === "helpful" && voteType === "not_helpful" ? -1 : existingVote.voteType === "not_helpful" && voteType === "helpful" ? 1 : 0;
    if (delta !== 0) await Review.findByIdAndUpdate(reviewId, { $inc: { helpfulCount: delta } });

    existingVote.voteType = voteType;
    await existingVote.save();

    const updated = await Review.findById(reviewId);
    return res.status(200).json({ success: true, message: "Vote updated", data: { reviewId, helpfulCount: updated.helpfulCount, vote: existingVote } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllReviewVotes,
  getReviewVoteById,
  getVotesByReviewId,
  createReviewVote,
  deleteReviewVote,
  voteOnReview,
};
