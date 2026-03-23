const mongoose = require("mongoose");

/**
 * Logical match to target `accounts` table.
 * Primary key: MongoDB `_id` (maps to account_id in relational terms).
 */
const accountSchema = new mongoose.Schema(
  {
    account_type: {
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
      sparse: true,
    },
    password_hash: {
      type: String,
      required: [true, "Password is required"],
    },
    account_status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
    },
    email_verified_at: {
      type: Date,
      default: null,
    },
    phone_verified_at: {
      type: Date,
      default: null,
    },
    last_login_at: {
      type: Date,
      default: null,
    },
    failed_login_count: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "accounts",
  }
);

accountSchema.index({ email: 1 }, { unique: true });
accountSchema.index({ username: 1 }, { unique: true, sparse: true });

/** Expose account_id alongside _id for API symmetry with target schema */
accountSchema.virtual("account_id").get(function () {
  return this._id;
});
accountSchema.set("toJSON", { virtuals: true });
accountSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Account", accountSchema);
