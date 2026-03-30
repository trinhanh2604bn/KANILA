const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: "OrderItem", default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant", default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewTitle: { type: String, default: "" },
    reviewContent: { type: String, default: "" },
    reviewStatus: { type: String, enum: ["visible", "hidden"], default: "visible" },
    helpfulCount: { type: Number, default: 0 },
    verifiedPurchaseFlag: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, reviewStatus: 1 });
reviewSchema.index({ customer_id: 1, productId: 1 });
reviewSchema.index({ orderItemId: 1, customer_id: 1 }, { unique: true, sparse: true });
reviewSchema.index({ reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
