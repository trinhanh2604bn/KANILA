const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor_account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null, index: true },
    action_code: { type: String, required: true, trim: true, index: true },
    entity_name: { type: String, required: true, trim: true, index: true },
    entity_id: { type: mongoose.Schema.Types.Mixed, default: null },
    old_values_json: { type: mongoose.Schema.Types.Mixed, default: null },
    new_values_json: { type: mongoose.Schema.Types.Mixed, default: null },
    ip_address: { type: String, default: "" },
    user_agent: { type: String, default: "" },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { collection: "audit_logs" }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
