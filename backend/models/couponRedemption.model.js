const mongoose = require("mongoose");

const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: [true, "Coupon ID is required"],
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    discountAmount: {
      type: Number,
      required: [true, "Discount amount is required"],
      min: [0, "Discount amount must not be negative"],
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
    redemptionStatus: {
      type: String,
      enum: ["used", "cancelled"],
      default: "used",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponRedemption", couponRedemptionSchema);
