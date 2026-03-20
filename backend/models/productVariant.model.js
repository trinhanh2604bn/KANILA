const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    barcode: {
      type: String,
      default: "",
    },
    variantName: {
      type: String,
      required: [true, "Variant name is required"],
      trim: true,
    },
    variantStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    weightGrams: {
      type: Number,
      default: 0,
    },
    volumeMl: {
      type: Number,
      default: 0,
    },
    costAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);
