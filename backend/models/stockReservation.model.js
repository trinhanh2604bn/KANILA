const mongoose = require("mongoose");

const stockReservationSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: [true, "Warehouse ID is required"],
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: [true, "Variant ID is required"],
    },
    cart_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      default: null,
    },
    checkout_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      default: null,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    reservedQty: {
      type: Number,
      required: [true, "Reserved quantity is required"],
      min: [1, "Reserved quantity must be at least 1"],
    },
    reservationStatus: {
      type: String,
      enum: ["active", "released", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockReservation", stockReservationSchema);
