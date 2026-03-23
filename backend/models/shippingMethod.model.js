const mongoose = require("mongoose");

/**
 * Target: `shipping_methods` — shipping_method_id = MongoDB _id
 */
const shippingMethodSchema = new mongoose.Schema(
  {
    shipping_method_code: {
      type: String,
      required: [true, "Shipping method code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    shipping_method_name: {
      type: String,
      required: [true, "Shipping method name is required"],
      trim: true,
    },
    carrier_code: {
      type: String,
      required: [true, "Carrier code is required"],
      trim: true,
    },
    service_level: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "shipping_methods",
  }
);

shippingMethodSchema.virtual("shipping_method_id").get(function () {
  return this._id;
});
shippingMethodSchema.set("toJSON", { virtuals: true });
shippingMethodSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ShippingMethod", shippingMethodSchema);
