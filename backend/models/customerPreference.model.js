const mongoose = require("mongoose");

/**
 * Logical match to target `customer_preferences` table.
 */
const customerPreferenceSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    preference_key: {
      type: String,
      required: true,
      trim: true,
    },
    preference_value: {
      type: String,
      default: "",
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "customer_preferences" }
);

customerPreferenceSchema.virtual("preference_id").get(function () {
  return this._id;
});
customerPreferenceSchema.set("toJSON", { virtuals: true });
customerPreferenceSchema.set("toObject", { virtuals: true });

customerPreferenceSchema.index({ customer_id: 1, preference_key: 1 }, { unique: true });

customerPreferenceSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("CustomerPreference", customerPreferenceSchema);
