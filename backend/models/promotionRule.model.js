const mongoose = require("mongoose");

const promotionRuleSchema = new mongoose.Schema(
  {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      required: [true, "Promotion ID is required"],
    },
    ruleType: {
      type: String,
      required: [true, "Rule type is required"],
    },
    operator: {
      type: String,
      required: [true, "Operator is required"],
    },
    ruleValue: {
      type: String,
      required: [true, "Rule value is required"],
    },
    currencyCode: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromotionRule", promotionRuleSchema);
