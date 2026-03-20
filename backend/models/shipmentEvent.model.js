const mongoose = require("mongoose");

const shipmentEventSchema = new mongoose.Schema(
  {
    shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment", required: true },
    eventCode: { type: String, required: true },
    eventStatus: { type: String, default: "" },
    eventDescription: { type: String, default: "" },
    eventTime: { type: Date, default: Date.now },
    locationText: { type: String, default: "" },
    rawPayloadJson: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShipmentEvent", shipmentEventSchema);
