const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, lowercase: true, trim: true },
    otp_hash: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true, index: true },
    used_at: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: "password_reset_otps" }
);

// Keep only a single active OTP per email.
passwordResetOtpSchema.index({ email: 1, used_at: 1, expires_at: 1 });

module.exports = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);

