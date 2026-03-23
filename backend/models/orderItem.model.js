const mongoose = require("mongoose");

/**
 * Target: `order_items` — order_item_id = MongoDB _id
 */
const orderItemSchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variant_id: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    sku_snapshot: { type: String, required: true },
    product_name_snapshot: { type: String, required: true },
    variant_name_snapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_list_price_amount: { type: Number, required: true, min: 0 },
    unit_sale_price_amount: { type: Number, default: 0, min: 0 },
    unit_final_price_amount: { type: Number, required: true, min: 0 },
    line_subtotal_amount: { type: Number, required: true, min: 0 },
    line_discount_amount: { type: Number, default: 0 },
    line_total_amount: { type: Number, required: true, min: 0 },
    currency_code: { type: String, default: "VND", trim: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "order_items",
  }
);

orderItemSchema.virtual("order_item_id").get(function () {
  return this._id;
});
orderItemSchema.set("toJSON", { virtuals: true });
orderItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("OrderItem", orderItemSchema);
