const mongoose = require("mongoose");

const productMediaSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    mediaUrl: {
      type: String,
      required: [true, "Media URL is required"],
    },
    altText: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/** Speeds “first image per product” aggregation used by product listing. */
productMediaSchema.index({ productId: 1, isPrimary: -1, sortOrder: 1, createdAt: 1 });

module.exports = mongoose.model("ProductMedia", productMediaSchema);
