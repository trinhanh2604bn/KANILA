const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    paymentMethodCode: {
      type: String,
      required: [true, "Payment method code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    paymentMethodName: {
      type: String,
      required: [true, "Payment method name is required"],
    },
    providerCode: {
      type: String,
      default: "",
    },
    methodType: {
      type: String,
      required: [true, "Method type is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
