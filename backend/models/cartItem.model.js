const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: [true, "Cart ID is required"],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
    },
    skuSnapshot: {
      type: String,
      required: [true, "SKU snapshot is required"],
    },
    productNameSnapshot: {
      type: String,
      required: [true, "Product name snapshot is required"],
    },
    variantNameSnapshot: {
      type: String,
      required: [true, "Variant name snapshot is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPriceAmount: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price must not be negative"],
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    finalUnitPriceAmount: {
      type: Number,
      required: [true, "Final unit price is required"],
      min: [0, "Final unit price must not be negative"],
    },
    lineTotalAmount: {
      type: Number,
      required: [true, "Line total is required"],
      min: [0, "Line total must not be negative"],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CartItem", cartItemSchema);
