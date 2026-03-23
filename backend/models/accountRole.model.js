const mongoose = require("mongoose");

const accountRoleSchema = new mongoose.Schema(
  {
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true, index: true },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    assigned_by_account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    assigned_at: { type: Date, default: Date.now },
  },
  { collection: "account_roles" }
);

accountRoleSchema.index({ account_id: 1, role_id: 1 }, { unique: true });

module.exports = mongoose.model("AccountRole", accountRoleSchema);
