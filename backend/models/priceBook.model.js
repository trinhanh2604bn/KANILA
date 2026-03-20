const mongoose = require("mongoose");

const priceBookSchema = new mongoose.Schema(
  {
    priceBookCode: {
      type: String,
      required: [true, "Price book code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    priceBookName: {
      type: String,
      required: [true, "Price book name is required"],
    },
    currencyCode: {
      type: String,
      required: [true, "Currency code is required"],
      default: "VND",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    priceBookStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PriceBook", priceBookSchema);
