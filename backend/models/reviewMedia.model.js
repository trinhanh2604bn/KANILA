const mongoose = require("mongoose");

const reviewMediaSchema = new mongoose.Schema(
  {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
    mediaUrl: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewMediaSchema.index({ reviewId: 1, sortOrder: 1 });

module.exports = mongoose.model("ReviewMedia", reviewMediaSchema);
