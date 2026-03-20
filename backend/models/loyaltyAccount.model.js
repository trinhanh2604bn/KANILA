const mongoose = require("mongoose");

const loyaltyAccountSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    tierId: { type: mongoose.Schema.Types.ObjectId, ref: "LoyaltyTier", default: null },
    pointsBalance: { type: Number, default: 0 },
    lifetimePointsEarned: { type: Number, default: 0 },
    lifetimePointsRedeemed: { type: Number, default: 0 },
    loyaltyStatus: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyAccount", loyaltyAccountSchema);
