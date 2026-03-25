const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Account = require("../models/account.model");
const Customer = require("../models/customer.model");
const PasswordResetOtp = require("../models/passwordResetOtp.model");
const { generateSixDigitOtp, sha256Hex } = require("../utils/otp");
const PASSWORD_RESET_DEBUG_OTP = process.env.PASSWORD_RESET_DEBUG_OTP || "999999";

// Helper: generate a simple customer code like CUS0001
const generateCustomerCode = async () => {
  const count = await Customer.countDocuments();
  const nextNum = count + 1;
  return `CUS${String(nextNum).padStart(4, "0")}`;
};

// Some legacy/migrated accounts have date fields persisted as `{}` objects.
// Mongoose will then fail `cast`/`validate` on `account.save()` during login.
const normalizeDateField = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // e.g. legacy `{}` or other non-date objects.
  return null;
};

const sanitizeAccountDatesForSave = (account) => {
  account.email_verified_at = normalizeDateField(account.email_verified_at);
  account.phone_verified_at = normalizeDateField(account.phone_verified_at);
  account.last_login_at = normalizeDateField(account.last_login_at);
  // These are set by mongoose timestamps; if they are persisted as `{}`, casting fails.
  account.created_at = normalizeDateField(account.created_at);
  account.updated_at = normalizeDateField(account.updated_at);
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    const full_name = req.body.full_name ?? req.body.fullName;
    const first_name = req.body.first_name ?? req.body.firstName ?? "";
    const last_name = req.body.last_name ?? req.body.lastName ?? "";

    // Required fields check
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "email, password, and full_name (or fullName) are required",
      });
    }

    // Check duplicate email
    const existingAccount = await Account.findOne({ email });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create account
    const account = await Account.create({
      email,
      phone: phone || "",
      password_hash,
      account_type: "customer",
    });

    const customer_code = await generateCustomerCode();
    const customer = await Customer.create({
      account_id: account._id,
      customer_code,
      full_name,
      first_name,
      last_name,
    });

    // Generate JWT
    const token = jwt.sign(
      { account_id: account._id, email: account.email, account_type: account.account_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
success: true,
      message: "Registration successful",
      data: {
        token,
        account: {
          _id: account._id,
          email: account.email,
          account_type: account.account_type,
        },
        customer: {
          _id: customer._id,
          customer_code: customer.customer_code,
          full_name: customer.full_name,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error?.keyPattern || error?.keyValue || {})[0] || "";
      if (duplicateField === "email") {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField || "unknown"}`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    // Find account
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (account.account_status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    if (account.account_status === "locked") {
      // Check if lock has expired
      if (account.locked_until && account.locked_until > new Date()) {
        return res.status(403).json({
          success: false,
          message: "Account is locked. Please try again later",
        });
      }
      // Lock expired, reset status
      account.account_status = "active";
      account.failed_login_count = 0;
      account.locked_until = null;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, account.password_hash);
    if (!isMatch) {
      // Increment failed login count
      account.failed_login_count += 1;
      sanitizeAccountDatesForSave(account);
      await account.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Successful login — update tracking fields
    account.last_login_at = new Date();
    account.failed_login_count = 0;
    sanitizeAccountDatesForSave(account);
    await account.save();

    // Get customer info
    const customer = await Customer.findOne({ account_id: account._id });

    // Generate JWT
    const token = jwt.sign(
      { account_id: account._id, email: account.email, account_type: account.account_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        account: {
          _id: account._id,
          email: account.email,
          account_type: account.account_type,
          last_login_at: account.last_login_at,
        },
customer: customer
          ? {
              _id: customer._id,
              customer_code: customer.customer_code,
              full_name: customer.full_name,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me (protected)
const getMe = async (req, res) => {
  try {
    const id = req.user.account_id || req.user.accountId;
    const account = await Account.findById(id).select("-password_hash");
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const customer = await Customer.findOne({ account_id: account._id });

    res.status(200).json({
      success: true,
      message: "Get current user successfully",
      data: {
        account,
        customer: customer || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  // Password reset flow used by client `forgot-password`
  checkEmail,
  verifyResetOtp,
  resetPassword,
};

// POST /api/auth/check-email
// Returns { exists: boolean } (matches the client expectation).
async function checkEmail(req, res) {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    if (!emailRaw) return res.status(400).json({ success: false, message: "Email is required" });

    const account = await Account.findOne({ email: emailRaw }).lean();
    if (!account) return res.status(200).json({ success: true, exists: false });

    // Block inactive/locked accounts (mirrors login behavior).
    if (account.account_status === "inactive") return res.status(200).json({ success: true, exists: false });
    if (account.account_status === "locked" && account.locked_until && account.locked_until > new Date()) {
      return res.status(200).json({ success: true, exists: false });
    }

    const otp = generateSixDigitOtp();
    const otpHash = sha256Hex(`${emailRaw}:${otp}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordResetOtp.findOneAndUpdate(
      { email: emailRaw, used_at: null },
      { $set: { otp_hash: otpHash, expires_at: expiresAt } },
      { upsert: true, new: true }
    );

    // Try to send email via SMTP if configured.
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || "no-reply@kanila.vn";

    const hasSmtp = !!smtpHost && !!smtpUser && !!smtpPass;
    if (hasSmtp) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      try {
        await transporter.sendMail({
          from: smtpFrom,
          to: emailRaw,
          subject: "Kanila - Mã xác thực đặt lại mật khẩu",
          text: `Mã xác thực của bạn là: ${otp}\nHết hạn sau 10 phút.\n`,
        });
      } catch (mailErr) {
        // If SMTP fails, keep the reset flow working.
        // eslint-disable-next-line no-console
        console.warn(`[WARN] Failed to send password reset email to ${emailRaw}:`, mailErr?.message || mailErr);
      }
    } else {
      // Dev-friendly fallback: keep the flow working by logging OTP when SMTP is not configured.
      // In production, you should set SMTP_* env vars.
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV !== "production") console.warn(`[DEV] Password reset OTP for ${emailRaw}: ${otp}`);
    }

    return res.status(200).json({ success: true, exists: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/auth/verify-reset-otp
async function verifyResetOtp(req, res) {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    if (!emailRaw || !otp) return res.status(400).json({ success: false, message: "Email and otp are required" });
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "OTP must be 6 digits" });

    // Debug fast-path: allow fixed OTP for testing.
    // NOTE: This is intentionally hard-coded to match your current testing requirement.
    if (otp === PASSWORD_RESET_DEBUG_OTP) {
      return res.status(200).json({ success: true });
    }

    const otpHash = sha256Hex(`${emailRaw}:${otp}`);
    const doc = await PasswordResetOtp.findOne({
      email: emailRaw,
      used_at: null,
      expires_at: { $gt: new Date() },
      otp_hash: otpHash,
    }).lean();

    if (!doc) return res.status(400).json({ success: false, message: "Mã xác thực sai hoặc đã hết hạn." });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  try {
    const emailRaw = String(req.body?.email || "").trim().toLowerCase();
    const otp = String(req.body?.otp || "").trim();
    const newPass = String(req.body?.newPass || "").trim();

    if (!emailRaw || !otp || !newPass) {
      return res.status(400).json({ success: false, message: "Email, otp and newPass are required" });
    }
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: "OTP must be 6 digits" });
    if (newPass.length < 8) return res.status(400).json({ success: false, message: "Mật khẩu yêu cầu tối thiểu 8 ký tự!" });

    // Debug fast-path: allow fixed OTP for testing.
    if (otp === PASSWORD_RESET_DEBUG_OTP) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPass, salt);
      await Account.findOneAndUpdate({ email: emailRaw }, { $set: { password_hash } });
      return res.status(200).json({ success: true, message: "Password reset successfully" });
    }

    const otpHash = sha256Hex(`${emailRaw}:${otp}`);
    const otpDoc = await PasswordResetOtp.findOne({
      email: emailRaw,
      used_at: null,
      expires_at: { $gt: new Date() },
      otp_hash: otpHash,
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "Mã xác thực sai hoặc đã hết hạn." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPass, salt);

    await Account.findOneAndUpdate({ email: emailRaw }, { $set: { password_hash } });
    otpDoc.used_at = new Date();
    await otpDoc.save();

    return res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}