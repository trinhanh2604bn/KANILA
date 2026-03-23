const mongoose = require("mongoose");

/**
 * Target: `order_status_history` — single `changed_at` timestamp (no created_at/updated_at)
 */
const orderStatusHistorySchema = new mongoose.Schema(
  {
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    old_order_status: { type: String, default: "" },
    new_order_status: { type: String, default: "" },
    old_payment_status: { type: String, default: "" },
    new_payment_status: { type: String, default: "" },
    old_fulfillment_status: { type: String, default: "" },
    new_fulfillment_status: { type: String, default: "" },
    changed_by_account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    change_reason: { type: String, default: "" },
    changed_at: { type: Date, default: Date.now },
  },
  { collection: "order_status_history" }
);

orderStatusHistorySchema.virtual("order_status_history_id").get(function () {
  return this._id;
});
orderStatusHistorySchema.set("toJSON", { virtuals: true });
orderStatusHistorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("OrderStatusHistory", orderStatusHistorySchema);
