const mongoose = require("mongoose");

const customerRecommendationSnapshotSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    // e.g. "skin_profile_homepage"
    recommendation_type: {
      type: String,
      required: true,
      index: true,
    },

    // Stable hash of the skin profile & preferences that influence recommendations.
    profile_hash: {
      type: String,
      required: true,
      index: true,
    },

    // Ranked list of product ids (top-N).
    product_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      index: true,
    },

    // Lightweight per-product metadata to keep ranking stable on read time.
    items: {
      type: [
        {
          product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
          score: { type: Number, default: 0 },
          reasons: { type: [String], default: [] },
          reason_codes: { type: [String], default: [] },
          badges: { type: [String], default: [] },
          score_breakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
        },
      ],
      default: [],
    },

    algorithm_version: { type: String, default: "rule_v1", index: true },

    generated_at: { type: Date, default: Date.now, index: true },
    expires_at: { type: Date, default: null, index: true },

    // Optional soft invalidation marker.
    invalidated_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "customer_recommendation_snapshots",
  }
);

// One snapshot per customer per recommendation_type.
customerRecommendationSnapshotSchema.index(
  { customer_id: 1, recommendation_type: 1 },
  { unique: true }
);

module.exports = mongoose.model("CustomerRecommendationSnapshot", customerRecommendationSnapshotSchema);

