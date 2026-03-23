const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      unique: true,
      required: [true, "Account ID is required"],
    },
    customerCode: {
      type: String,
      required: [true, "Customer code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    customerStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "customers" }
);

module.exports = mongoose.model("Customer", customerSchema);
