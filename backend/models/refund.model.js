const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    paymentTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
    refundReason: { type: String, default: "" },
    refundStatus: { type: String, enum: ["requested", "approved", "processing", "completed", "rejected"], default: "requested" },
    requestedAmount: { type: Number, required: true, min: 0 },
    approvedAmount: { type: Number, default: 0 },
    refundedAmount: { type: Number, default: 0 },
    currencyCode: { type: String, default: "VND" },
    requestedByAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    approvedByAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Refund", refundSchema);
