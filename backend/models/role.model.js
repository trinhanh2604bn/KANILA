const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    role_code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    role_name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    is_system_role: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "roles",
  }
);

module.exports = mongoose.model("Role", roleSchema);
