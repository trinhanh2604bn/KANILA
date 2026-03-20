const mongoose = require("mongoose");

const reviewVoteSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    voteType: { type: String, enum: ["helpful", "not_helpful"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewVote", reviewVoteSchema);
