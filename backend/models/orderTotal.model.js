const mongoose = require("mongoose");

const orderTotalSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    subtotalAmount: { type: Number, default: 0 },
    itemDiscountAmount: { type: Number, default: 0 },
    orderDiscountAmount: { type: Number, default: 0 },
    shippingFeeAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotalAmount: { type: Number, default: 0 },
    refundedAmount: { type: Number, default: 0 },
    currencyCode: { type: String, default: "VND" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderTotal", orderTotalSchema);
