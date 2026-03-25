const mongoose = require("mongoose");

const customerCouponSchema = new mongoose.Schema(
  {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: [true, "Coupon ID is required"],
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer ID is required"],
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["saved", "used", "expired"],
      default: "saved",
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "customer_coupons",
  }
);

customerCouponSchema.index({ customer_id: 1, couponId: 1 }, { unique: true });

module.exports = mongoose.model("CustomerCoupon", customerCouponSchema);
