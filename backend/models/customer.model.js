const mongoose = require("mongoose");

/**
 * Logical match to target `customer_profiles` table.
 * Primary key: MongoDB `_id` (maps to customer_id in relational terms).
 */
const customerSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      unique: true,
      required: [true, "Account ID is required"],
    },
    customer_code: {
      type: String,
      required: [true, "Customer code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    first_name: {
      type: String,
      default: "",
      trim: true,
    },
    last_name: {
      type: String,
      default: "",
      trim: true,
    },
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    date_of_birth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      default: "",
      trim: true,
    },
    avatar_url: {
      type: String,
      default: "",
      trim: true,
    },
    customer_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    registered_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "customer_profiles",
  }
);

customerSchema.virtual("customer_id").get(function () {
  return this._id;
});
customerSchema.set("toJSON", { virtuals: true });
customerSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Customer", customerSchema);
