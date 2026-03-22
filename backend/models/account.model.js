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
      trim: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
      unique: true,
      sparse: true, // Allow multiple empty/null values
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

// Create indexes
accountSchema.index({ email: 1 }, { unique: true });
accountSchema.index({ username: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Account", accountSchema);
