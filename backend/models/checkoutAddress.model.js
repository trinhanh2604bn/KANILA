const mongoose = require("mongoose");

const checkoutAddressSchema = new mongoose.Schema(
  {
    checkoutSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      required: [true, "Checkout session ID is required"],
    },
    addressType: {
      type: String,
      enum: ["shipping", "billing"],
      required: [true, "Address type is required"],
    },
    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required"],
    },
    addressLine2: {
      type: String,
      default: "",
    },
    ward: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    countryCode: {
      type: String,
      default: "VN",
    },
    postalCode: {
      type: String,
      default: "",
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckoutAddress", checkoutAddressSchema);
