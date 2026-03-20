const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    promotionCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      default: null,
    },
    promotionName: {
      type: String,
      required: [true, "Promotion name is required"],
    },
    description: {
      type: String,
      default: "",
    },
    promotionType: {
      type: String,
      required: [true, "Promotion type is required"],
    },
    discountType: {
      type: String,
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value must not be negative"],
    },
    maxDiscountAmount: {
      type: Number,
      default: 0,
    },
    startAt: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endAt: {
      type: Date,
      default: null,
    },
    usageLimitTotal: {
      type: Number,
      default: 0,
    },
    usageLimitPerCustomer: {
      type: Number,
      default: 0,
    },
    isAutoApply: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 0,
    },
    stackableFlag: {
      type: Boolean,
      default: false,
    },
    promotionStatus: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft",
    },
    createdByAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Promotion", promotionSchema);
