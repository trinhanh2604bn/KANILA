const mongoose = require("mongoose");

const shippingMethodSchema = new mongoose.Schema(
  {
    shippingMethodCode: {
      type: String,
      required: [true, "Shipping method code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    shippingMethodName: {
      type: String,
      required: [true, "Shipping method name is required"],
    },
    carrierCode: {
      type: String,
      required: [true, "Carrier code is required"],
    },
    serviceLevel: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingMethod", shippingMethodSchema);
