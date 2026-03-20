const mongoose = require("mongoose");

const loyaltyPointLedgerSchema = new mongoose.Schema(
  {
    loyaltyAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "LoyaltyAccount", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    transactionType: { type: String, required: true },
    pointsDelta: { type: Number, required: true },
    pointsBefore: { type: Number, default: 0 },
    pointsAfter: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
    referenceType: { type: String, default: "" },
    referenceId: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyPointLedger", loyaltyPointLedgerSchema);
