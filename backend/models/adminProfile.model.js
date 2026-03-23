const mongoose = require("mongoose");

const adminProfileSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      unique: true,
      index: true,
    },
    employee_code: { type: String, default: "", trim: true },
    full_name: { type: String, required: true, trim: true },
    department: { type: String, default: "", trim: true },
    job_title: { type: String, default: "", trim: true },
    manager_account_id: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    employment_status: {
      type: String,
      enum: ["active", "inactive", "terminated", "leave"],
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "admin_profiles",
  }
);

module.exports = mongoose.model("AdminProfile", adminProfileSchema);
