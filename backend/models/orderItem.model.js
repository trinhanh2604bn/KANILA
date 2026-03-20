const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", required: true },
    skuSnapshot: { type: String, required: true },
    productNameSnapshot: { type: String, required: true },
    variantNameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitListPriceAmount: { type: Number, required: true, min: 0 },
    unitSalePriceAmount: { type: Number, default: 0, min: 0 },
    unitFinalPriceAmount: { type: Number, required: true, min: 0 },
    lineSubtotalAmount: { type: Number, required: true, min: 0 },
    lineDiscountAmount: { type: Number, default: 0 },
    lineTotalAmount: { type: Number, required: true, min: 0 },
    currencyCode: { type: String, default: "VND" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItem", orderItemSchema);
