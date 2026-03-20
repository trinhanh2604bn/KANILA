const mongoose = require("mongoose");

const priceBookEntrySchema = new mongoose.Schema(
  {
    priceBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceBook",
      required: [true, "Price book ID is required"],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
    },
    listPriceAmount: {
      type: Number,
      required: [true, "List price is required"],
      min: [0, "List price must not be negative"],
    },
    salePriceAmount: {
      type: Number,
      default: 0,
      min: [0, "Sale price must not be negative"],
    },
    effectiveFrom: {
      type: Date,
      default: null,
    },
    effectiveTo: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PriceBookEntry", priceBookEntrySchema);
