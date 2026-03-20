const mongoose = require("mongoose");

const priceHistorySchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
    },
    priceBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PriceBook",
      required: [true, "Price book ID is required"],
    },
    currencyCode: {
      type: String,
      required: [true, "Currency code is required"],
    },
    oldListPriceAmount: {
      type: Number,
      default: 0,
    },
    oldSalePriceAmount: {
      type: Number,
      default: 0,
    },
    newListPriceAmount: {
      type: Number,
      default: 0,
    },
    newSalePriceAmount: {
      type: Number,
      default: 0,
    },
    changeReason: {
      type: String,
      default: "",
    },
    changedByAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PriceHistory", priceHistorySchema);
