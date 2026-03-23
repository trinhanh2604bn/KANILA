const mongoose = require("mongoose");

/**
 * Target: `checkout_addresses` — checkout_address_id = MongoDB _id
 */
const checkoutAddressSchema = new mongoose.Schema(
  {
    checkout_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      required: [true, "Checkout session ID is required"],
      index: true,
    },
    address_type: {
      type: String,
      enum: ["shipping", "billing"],
      required: [true, "Address type is required"],
    },
    recipient_name: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    address_line_1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
    },
    address_line_2: {
      type: String,
      default: "",
      trim: true,
    },
    ward: {
      type: String,
      default: "",
      trim: true,
    },
    district: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    country_code: {
      type: String,
      default: "VN",
      trim: true,
    },
    postal_code: {
      type: String,
      default: "",
      trim: true,
    },
    is_selected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "checkout_addresses",
  }
);

checkoutAddressSchema.virtual("checkout_address_id").get(function () {
  return this._id;
});
checkoutAddressSchema.set("toJSON", { virtuals: true });
checkoutAddressSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CheckoutAddress", checkoutAddressSchema);
