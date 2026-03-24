const mongoose = require("mongoose");

const recommendationLogSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true, default: null },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    context: {
      type: String,
      enum: ["homepage", "profile_page", "category_page", "preview", "unknown"],
      default: "unknown",
      index: true,
    },
    category_context: { type: String, default: "" },
    score: { type: Number, required: true },
    reason_codes: { type: [String], default: [] },
    reasons: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    score_breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    rank_position: { type: Number, default: 0 },
    generated_at: { type: Date, default: Date.now, index: true },
    algorithm_version: { type: String, default: "rule_v1", index: true },
    session_id: { type: String, default: "" },
    request_source: { type: String, default: "" },
  },
  { timestamps: true, collection: "recommendation_logs" }
);

module.exports = mongoose.model("RecommendationLog", recommendationLogSchema);
