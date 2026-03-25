const mongoose = require("mongoose");

/**
 * Target: `carts` — cart_id = MongoDB _id
 */
const cartSchema = new mongoose.Schema(
  {
    owner_type: {
      type: String,
      enum: ["customer", "guest"],
      default: "customer",
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
      index: true,
    },
    guest_session_id: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    cart_status: {
      type: String,
      enum: ["active", "converted", "expired", "merged"],
      default: "active",
    },
    currency_code: {
      type: String,
      default: "VND",
      trim: true,
    },
    item_count: {
      type: Number,
      default: 0,
    },
    subtotal_amount: {
      type: Number,
      default: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
    },
    total_amount: {
      type: Number,
      default: 0,
    },
    expires_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "carts",
  }
);

cartSchema.virtual("cart_id").get(function () {
  return this._id;
});
cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Cart", cartSchema);
