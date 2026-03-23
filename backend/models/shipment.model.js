const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", default: null },
    shipmentNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    carrierCode: { type: String, default: "" },
    serviceName: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    shipmentStatus: { type: String, enum: ["pending", "shipped", "in_transit", "delivered", "failed"], default: "pending" },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    shippingFeeAmount: { type: Number, default: 0 },
    currencyCode: { type: String, default: "VND" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);
