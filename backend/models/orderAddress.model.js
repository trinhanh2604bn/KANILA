const mongoose = require("mongoose");

/**
 * Target: `order_addresses` — only `created_at` (no updated_at in relational schema)
 */
const orderAddressSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    address_type: { type: String, enum: ["shipping", "billing"], required: true },
    recipient_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address_line_1: { type: String, required: true, trim: true },
    address_line_2: { type: String, default: "", trim: true },
    ward: { type: String, default: "", trim: true },
    district: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    country_code: { type: String, default: "VN", trim: true },
    postal_code: { type: String, default: "", trim: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "order_addresses" }
);

orderAddressSchema.virtual("order_address_id").get(function () {
  return this._id;
});
orderAddressSchema.set("toJSON", { virtuals: true });
orderAddressSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("OrderAddress", orderAddressSchema);
