const mongoose = require("mongoose");

/**
 * Junction: many-to-many between products and categories (product_categories).
 * Use with Product.categoryId for the primary category, or mark one row isPrimary.
 */
const productCategorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category ID is required"],
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productCategorySchema.index({ productId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model("ProductCategory", productCategorySchema);
