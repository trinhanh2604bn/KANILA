const mongoose = require("mongoose");

/**
 * Target: `order_totals` — order_total_id = MongoDB _id
 */
const orderTotalSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    subtotal_amount: { type: Number, default: 0 },
    item_discount_amount: { type: Number, default: 0 },
    order_discount_amount: { type: Number, default: 0 },
    shipping_fee_amount: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    grand_total_amount: { type: Number, default: 0 },
    refunded_amount: { type: Number, default: 0 },
    currency_code: { type: String, default: "VND", trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "order_totals",
  }
);

orderTotalSchema.virtual("order_total_id").get(function () {
  return this._id;
});
orderTotalSchema.set("toJSON", { virtuals: true });
orderTotalSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("OrderTotal", orderTotalSchema);
