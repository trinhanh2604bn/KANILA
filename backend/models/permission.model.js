const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    permission_code: { type: String, required: true, unique: true, trim: true },
    permission_name: { type: String, required: true, trim: true },
    module_name: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    created_at: { type: Date, default: Date.now },
  },
  { collection: "permissions" }
);

module.exports = mongoose.model("Permission", permissionSchema);
