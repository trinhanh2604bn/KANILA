const mongoose = require("mongoose");

const productMediaSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    mediaUrl: {
      type: String,
      required: [true, "Media URL is required"],
    },
    altText: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductMedia", productMediaSchema);
