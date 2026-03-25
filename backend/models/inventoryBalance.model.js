const mongoose = require("mongoose");

const inventoryBalanceSchema = new mongoose.Schema(
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
    onHandQty: {
      type: Number,
      default: 0,
    },
    reservedQty: {
      type: Number,
      default: 0,
    },
    blockedQty: {
      type: Number,
      default: 0,
    },
    availableQty: {
      type: Number,
      default: 0,
    },
    reorderPointQty: {
      type: Number,
      default: 0,
    },
    safetyStockQty: {
      type: Number,
      default: 0,
    },
    lastCountedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Facet / availability hot path
inventoryBalanceSchema.index({ variantId: 1, availableQty: 1 });

module.exports = mongoose.model("InventoryBalance", inventoryBalanceSchema);
