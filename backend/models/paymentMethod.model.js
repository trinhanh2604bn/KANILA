const mongoose = require("mongoose");

/**
 * Target: `payment_methods` — payment_method_id = MongoDB _id
 */
const paymentMethodSchema = new mongoose.Schema(
  {
    payment_method_code: {
      type: String,
      required: [true, "Payment method code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    payment_method_name: {
      type: String,
      required: [true, "Payment method name is required"],
      trim: true,
    },
    provider_code: {
      type: String,
      default: "",
      trim: true,
    },
    method_type: {
      type: String,
      required: [true, "Method type is required"],
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "payment_methods",
  }
);

paymentMethodSchema.virtual("payment_method_id").get(function () {
  return this._id;
});
paymentMethodSchema.set("toJSON", { virtuals: true });
paymentMethodSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
