const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema(
  {
    returnId: { type: mongoose.Schema.Types.ObjectId, ref: "Return", required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    requestedQty: { type: Number, required: true, min: 1 },
    approvedQty: { type: Number, default: 0 },
    receivedQty: { type: Number, default: 0 },
    restockQty: { type: Number, default: 0 },
    rejectQty: { type: Number, default: 0 },
    restockStatus: { type: String, enum: ["pending", "restocked", "disposed"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnItem", returnItemSchema);
