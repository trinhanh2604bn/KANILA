const mongoose = require("mongoose");

/**
 * Logical match to target `customer_consents` table.
 */
const customerConsentSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    consent_type: {
      type: String,
      required: true,
      trim: true,
    },
    consent_status: {
      type: String,
      required: true,
      trim: true,
    },
    consent_version: {
      type: String,
      default: "",
      trim: true,
    },
    consented_at: {
      type: Date,
      default: null,
    },
    source_channel: {
      type: String,
      default: "",
      trim: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "customer_consents" }
);

customerConsentSchema.virtual("consent_id").get(function () {
  return this._id;
});
customerConsentSchema.set("toJSON", { virtuals: true });
customerConsentSchema.set("toObject", { virtuals: true });

customerConsentSchema.index({ customer_id: 1, consent_type: 1 });

module.exports = mongoose.model("CustomerConsent", customerConsentSchema);
