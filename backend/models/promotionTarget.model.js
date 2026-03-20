const mongoose = require("mongoose");

const promotionTargetSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: [true, "Promotion ID is required"],
    },
    targetType: {
      type: String,
      required: [true, "Target type is required"],
    },
    targetRefId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    targetRefCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionTarget", promotionTargetSchema);
