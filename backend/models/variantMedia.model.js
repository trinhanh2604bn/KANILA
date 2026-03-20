const mongoose = require("mongoose");

const variantMediaSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
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

module.exports = mongoose.model("VariantMedia", variantMediaSchema);
