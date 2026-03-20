const mongoose = require("mongoose");

const checkoutShippingMethodSchema = new mongoose.Schema(
  {
    checkoutSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      required: [true, "Checkout session ID is required"],
    },
    shippingMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingMethod",
      required: [true, "Shipping method ID is required"],
    },
    shippingMethodCode: {
      type: String,
      required: [true, "Shipping method code is required"],
    },
    carrierCode: {
      type: String,
      required: [true, "Carrier code is required"],
    },
    serviceName: {
      type: String,
      required: [true, "Service name is required"],
    },
    estimatedDaysMin: {
      type: Number,
      default: 0,
    },
    estimatedDaysMax: {
      type: Number,
      default: 0,
    },
    shippingFeeAmount: {
      type: Number,
      default: 0,
    },
    currencyCode: {
      type: String,
      default: "VND",
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckoutShippingMethod", checkoutShippingMethodSchema);
