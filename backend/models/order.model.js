const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    checkoutSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "CheckoutSession", default: null },
    currencyCode: { type: String, default: "VND" },
    orderStatus: { type: String, enum: ["pending", "confirmed", "processing", "completed", "cancelled"], default: "pending" },
    paymentStatus: { type: String, enum: ["unpaid", "authorized", "paid", "partially_refunded", "refunded"], default: "unpaid" },
    fulfillmentStatus: { type: String, enum: ["unfulfilled", "partially_fulfilled", "fulfilled", "returned"], default: "unfulfilled" },
    customerNote: { type: String, default: "" },
    placedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
