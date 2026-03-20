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

module.exports = mongoose.model("ProductAttribute", productAttributeSchema);
