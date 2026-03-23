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
    reviewStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    helpfulCount: { type: Number, default: 0 },
    verifiedPurchaseFlag: { type: Boolean, default: false },
    approvedByAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
