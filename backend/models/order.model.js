const mongoose = require("mongoose");

/**
 * Target: `orders` — order_id = MongoDB _id
 */
const orderSchema = new mongoose.Schema(
  {
    owner_type: {
      type: String,
      enum: ["customer", "guest"],
      default: "customer",
      index: true,
    },
    guest_session_id: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    guest_email: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    guest_phone: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    guest_full_name: {
      type: String,
      default: "",
      trim: true,
    },
    order_number: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      index: true,
    },
    checkout_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CheckoutSession",
      default: null,
    },
    currency_code: { type: String, default: "VND", trim: true },
    order_status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "completed", "cancelled", "returned"],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "pending", "authorized", "paid", "failed", "partially_refunded", "refunded"],
      default: "unpaid",
    },
    fulfillment_status: {
      type: String,
      enum: ["unfulfilled", "preparing", "partially_shipped", "shipped", "in_transit", "delivered", "partially_returned", "returned"],
      default: "unfulfilled",
    },
    customer_note: { type: String, default: "" },
    placed_at: { type: Date, default: Date.now },
    confirmed_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    cancellation_reason: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "orders",
  }
);

orderSchema.virtual("order_id").get(function () {
  return this._id;
});
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
