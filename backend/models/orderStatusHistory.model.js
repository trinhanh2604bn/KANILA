const mongoose = require("mongoose");

const orderStatusHistorySchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    oldOrderStatus: { type: String, default: "" },
    newOrderStatus: { type: String, default: "" },
    oldPaymentStatus: { type: String, default: "" },
    newPaymentStatus: { type: String, default: "" },
    oldFulfillmentStatus: { type: String, default: "" },
    newFulfillmentStatus: { type: String, default: "" },
    changedByAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    changeReason: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderStatusHistory", orderStatusHistorySchema);
