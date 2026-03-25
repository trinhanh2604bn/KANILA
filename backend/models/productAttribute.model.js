const mongoose = require("mongoose");

const productAttributeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    attributeName: {
      type: String,
      required: [true, "Attribute name is required"],
      trim: true,
    },
    attributeValue: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productAttributeSchema.index({ productId: 1, displayOrder: 1 });

// Common facet lookup paths (future-proof for storefront facet filtering)
productAttributeSchema.index({ attributeName: 1, attributeValue: 1, productId: 1 });

module.exports = mongoose.model("ProductAttribute", productAttributeSchema);
