const mongoose = require("mongoose");

const productOptionValueSchema = new mongoose.Schema(
  {
    productOptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductOption",
      required: [true, "Product option ID is required"],
    },
    optionValue: {
      type: String,
      required: [true, "Option value is required"],
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productOptionValueSchema.index({ productOptionId: 1, displayOrder: 1 });

// Common lookup path for option value facets
productOptionValueSchema.index({ optionValue: 1, productOptionId: 1 });

module.exports = mongoose.model("ProductOptionValue", productOptionValueSchema);
