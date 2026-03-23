const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    permission_id: { type: mongoose.Schema.Types.ObjectId, ref: "Permission", required: true, index: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "role_permissions" }
);

rolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
