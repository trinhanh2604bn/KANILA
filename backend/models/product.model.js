const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "Brand is required"],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must not be negative"],
    },
    /** Optional list/original price for discount display (sale price = `price`) */
    compareAtPrice: {
      type: Number,
      min: [0, "Compare-at price must not be negative"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    longDescription: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock must not be negative"],
    },
    bought: {
      type: Number,
      default: 0,
      min: [0, "Bought must not be negative"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating must not be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
