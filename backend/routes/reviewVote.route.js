const express = require("express");
const router = express.Router();
const { getAllReviewVotes, getReviewVoteById, getVotesByReviewId, createReviewVote, deleteReviewVote } = require("../controllers/reviewVote.controller");
router.get("/", getAllReviewVotes);
router.get("/review/:reviewId", getVotesByReviewId);
router.get("/:id", getReviewVoteById);
router.post("/", createReviewVote);
router.delete("/:id", deleteReviewVote);
module.exports = router;
