const mongoose = require("mongoose");

const paymentIntentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    payment_method_id: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod", default: null },
    providerCode: { type: String, default: "" },
    providerPaymentIntentId: { type: String, default: "" },
    requestedAmount: { type: Number, required: true, min: 0 },
    authorizedAmount: { type: Number, default: 0 },
    capturedAmount: { type: Number, default: 0 },
    currencyCode: { type: String, default: "VND" },
    intentStatus: { type: String, enum: ["pending", "authorized", "captured", "failed", "cancelled"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentIntent", paymentIntentSchema);
