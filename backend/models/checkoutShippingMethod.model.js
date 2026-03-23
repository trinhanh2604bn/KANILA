const mongoose = require("mongoose");

/**
 * Target: `checkout_shipping_methods` — only `created_at` in relational schema (no updated_at).
 */
const checkoutShippingMethodSchema = new mongoose.Schema(
  {
    checkout_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      required: [true, "Checkout session ID is required"],
      index: true,
    },
    shipping_method_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingMethod",
      required: [true, "Shipping method ID is required"],
    },
    shipping_method_code: {
      type: String,
      required: [true, "Shipping method code is required"],
      trim: true,
    },
    carrier_code: {
      type: String,
      required: [true, "Carrier code is required"],
      trim: true,
    },
    service_name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    estimated_days_min: {
      type: Number,
      default: 0,
    },
    estimated_days_max: {
      type: Number,
      default: 0,
    },
    shipping_fee_amount: {
      type: Number,
      default: 0,
    },
    currency_code: {
      type: String,
      default: "VND",
      trim: true,
    },
    is_selected: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "checkout_shipping_methods" }
);

checkoutShippingMethodSchema.virtual("checkout_shipping_method_id").get(function () {
  return this._id;
});
checkoutShippingMethodSchema.set("toJSON", { virtuals: true });
checkoutShippingMethodSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CheckoutShippingMethod", checkoutShippingMethodSchema);
