const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Account = require("../models/account.model");
const Customer = require("../models/customer.model");

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
      return res.status(400).json({
        success: false,
        message: "Email already registered",
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
};
