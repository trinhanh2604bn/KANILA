const mongoose = require("mongoose");

const reviewSummarySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, unique: true },
    reviewCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    rating1Count: { type: Number, default: 0 },
    rating2Count: { type: Number, default: 0 },
    rating3Count: { type: Number, default: 0 },
    rating4Count: { type: Number, default: 0 },
    rating5Count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewSummary", reviewSummarySchema);
