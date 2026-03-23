const mongoose = require("mongoose");

/**
 * Target: `cart_items` — cart_item_id = MongoDB _id
 */
const cartItemSchema = new mongoose.Schema(
  {
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart ID is required"],
      index: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
    },
    sku_snapshot: {
      type: String,
      required: [true, "SKU snapshot is required"],
      trim: true,
    },
    product_name_snapshot: {
      type: String,
      required: [true, "Product name snapshot is required"],
      trim: true,
    },
    variant_name_snapshot: {
      type: String,
      required: [true, "Variant name snapshot is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unit_price_amount: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price must not be negative"],
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    final_unit_price_amount: {
      type: Number,
      required: [true, "Final unit price is required"],
      min: [0, "Final unit price must not be negative"],
    },
    line_total_amount: {
      type: Number,
      required: [true, "Line total is required"],
      min: [0, "Line total must not be negative"],
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updated_at" },
    collection: "cart_items",
  }
);

cartItemSchema.virtual("cart_item_id").get(function () {
  return this._id;
});
cartItemSchema.set("toJSON", { virtuals: true });
cartItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("CartItem", cartItemSchema);
