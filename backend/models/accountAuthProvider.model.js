const mongoose = require("mongoose");

const accountAuthProviderSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    provider_code: { type: String, required: true, trim: true },
    provider_subject: { type: String, required: true, trim: true },
    provider_email: { type: String, default: "", trim: true, lowercase: true },
    linked_at: { type: Date, default: Date.now },
    last_used_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "account_auth_providers",
  }
);

accountAuthProviderSchema.index({ account_id: 1, provider_code: 1 }, { unique: true });

module.exports = mongoose.model("AccountAuthProvider", accountAuthProviderSchema);
