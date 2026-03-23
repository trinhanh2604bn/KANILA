const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentIntent", required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    transactionType: { type: String, required: true },
    providerTransactionId: { type: String, default: "" },
    transactionStatus: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    amount: { type: Number, required: true, min: 0 },
    currencyCode: { type: String, default: "VND" },
    processedAt: { type: Date, default: Date.now },
    rawResponseJson: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
