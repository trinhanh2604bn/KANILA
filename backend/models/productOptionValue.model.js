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

module.exports = mongoose.model("ProductOptionValue", productOptionValueSchema);
