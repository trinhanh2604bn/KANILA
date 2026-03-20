const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      required: [true, "Account type is required"],
      enum: ["customer", "admin", "staff"],
      default: "customer",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      default: "",
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginCount: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
