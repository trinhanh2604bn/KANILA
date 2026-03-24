const mongoose = require("mongoose");

const guestSessionSchema = new mongoose.Schema(
  {
    guest_session_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    last_seen_at: {
      type: Date,
      default: Date.now,
    },
    user_agent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "guest_sessions",
  }
);

module.exports = mongoose.model("GuestSession", guestSessionSchema);
