const ReviewVote = require("../models/reviewVote.model");
const Review = require("../models/review.model");
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

module.exports = { getAllReviewVotes, getReviewVoteById, getVotesByReviewId, createReviewVote, deleteReviewVote };
