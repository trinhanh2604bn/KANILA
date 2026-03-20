const mongoose = require("mongoose");

const shipmentItemSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    shippedQty: { type: Number, default: 0 },
    deliveredQty: { type: Number, default: 0 },
    returnedQty: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShipmentItem", shipmentItemSchema);
