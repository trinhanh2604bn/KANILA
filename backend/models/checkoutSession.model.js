const mongoose = require("mongoose");

const checkoutSessionSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart ID is required"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    checkoutStatus: {
      type: String,
      enum: ["in_progress", "completed", "expired"],
      default: "in_progress",
    },
    currencyCode: {
      type: String,
      default: "VND",
    },
    selectedShippingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutAddress",
      default: null,
    },
    selectedBillingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutAddress",
      default: null,
    },
    selectedShippingMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutShippingMethod",
      default: null,
    },
    selectedPaymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },
    subtotalAmount: {
      type: Number,
      default: 0,
    },
    shippingFeeAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
