const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    warehouseCode: {
      type: String,
      required: [true, "Warehouse code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    warehouseName: {
      type: String,
      required: [true, "Warehouse name is required"],
    },
    contactName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    addressLine1: {
      type: String,
      required: [true, "Address line 1 is required"],
    },
    addressLine2: {
      type: String,
      default: "",
    },
    ward: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    countryCode: {
      type: String,
      default: "VN",
    },
    warehouseStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Warehouse", warehouseSchema);
