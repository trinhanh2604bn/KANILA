const mongoose = require("mongoose");

/**
 * Target: `checkout_sessions` — checkout_session_id = MongoDB _id
 */
const checkoutSessionSchema = new mongoose.Schema(
  {
    owner_type: {
      type: String,
      enum: ["customer", "guest"],
      default: "customer",
      index: true,
    },
    guest_session_id: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart ID is required"],
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      index: true,
    },
    guest_email: {
      type: String,
      default: "",
      trim: true,
    },
    guest_phone: {
      type: String,
      default: "",
      trim: true,
    },
    guest_full_name: {
      type: String,
      default: "",
      trim: true,
    },
    checkout_status: {
      type: String,
      enum: ["in_progress", "completed", "expired"],
      default: "in_progress",
    },
    currency_code: {
      type: String,
      default: "VND",
      trim: true,
    },
    selected_shipping_address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutAddress",
      default: null,
    },
    selected_billing_address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutAddress",
      default: null,
    },
    selected_shipping_method_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutShippingMethod",
      default: null,
    },
    selected_payment_method_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentMethod",
      default: null,
    },
    subtotal_amount: {
      type: Number,
      default: 0,
    },
    shipping_fee_amount: {
      type: Number,
      default: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    applied_coupon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    applied_coupon_code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    coupon_discount_amount: {
      type: Number,
      default: 0,
    },
    tax_amount: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    expires_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "checkout_sessions",
  }
);

checkoutSessionSchema.virtual("checkout_session_id").get(function () {
  return this._id;
});
checkoutSessionSchema.set("toJSON", { virtuals: true });
checkoutSessionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);
