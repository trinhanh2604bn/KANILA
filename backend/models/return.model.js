const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", default: null },
    returnNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    returnReason: { type: String, default: "" },
    returnStatus: { type: String, enum: ["requested", "approved", "received", "completed", "rejected"], default: "requested" },
    requestedByCustomerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    approvedByAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Return", returnSchema);
