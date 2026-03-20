const mongoose = require("mongoose");

const loyaltyTierSchema = new mongoose.Schema(
  {
    tierCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tierName: { type: String, required: true },
    minimumPoints: { type: Number, default: 0 },
    discountRate: { type: Number, default: 0 },
    priorityRank: { type: Number, default: 0 },
    tierStatus: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyTier", loyaltyTierSchema);
