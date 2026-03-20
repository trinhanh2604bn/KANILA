const mongoose = require("mongoose");

const orderAddressSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    addressType: { type: String, enum: ["shipping", "billing"], required: true },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    ward: { type: String, default: "" },
    district: { type: String, default: "" },
    city: { type: String, required: true },
    countryCode: { type: String, default: "VN" },
    postalCode: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderAddress", orderAddressSchema);
