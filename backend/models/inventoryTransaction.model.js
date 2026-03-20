const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
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
    transactionType: {
      type: String,
      required: [true, "Transaction type is required"],
    },
    quantityChange: {
      type: Number,
      required: [true, "Quantity change is required"],
    },
    referenceType: {
      type: String,
      default: "",
    },
    referenceId: {
      type: String,
      default: "",
    },
    reasonCode: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
    performedByAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
