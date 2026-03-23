const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");
const bcrypt = require("bcryptjs");
const { pickAccountType, pickAccountStatus } = require("../utils/accountBody");

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  return null;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : "Invalid email format";
};

const validatePhone = (phone) => {
  if (!phone) return null;
  const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
  return phoneRegex.test(phone) ? null : "Invalid phone format";
};

const PUBLIC_FIELDS = "-password_hash";

// GET /api/accounts
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find().select(PUBLIC_FIELDS).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Get all accounts successfully",
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounts/:id
const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const account = await Account.findById(id).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Get account successfully",
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/accounts
const createAccount = async (req, res) => {
  try {
    const { email, password, username, phone } = req.body;
    const account_type = pickAccountType(req.body) || "customer";
    const account_status = pickAccountStatus(req.body) || "active";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ success: false, message: emailError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({ success: false, message: phoneError });
      }
    }

    const validAccountTypes = ["customer", "admin", "staff"];
    if (!validAccountTypes.includes(account_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account type. Must be one of: ${validAccountTypes.join(", ")}`,
      });
    }

    const validStatuses = ["active", "inactive", "locked"];
    if (!validStatuses.includes(account_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const emailLower = email.toLowerCase().trim();

    const existing = await Account.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    if (username) {
      const existingUsername = await Account.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const account = await Account.create({
      email: emailLower,
      password_hash,
      account_type,
      username: username ? username.trim() : "",
      phone: phone ? phone.trim() : "",
      account_status,
    });

    const result = account.toObject();
    delete result.password_hash;

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: result,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounts/:id
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    delete req.body.password_hash;
    delete req.body.passwordHash;
    delete req.body.password;

    const account = await Account.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/accounts/:id
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const account = await Account.findByIdAndDelete(id);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const result = account.toObject();
    delete result.password_hash;

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/accounts/:id
const patchAccount = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid account ID" });
    }

    const allowedSnake = ["account_status", "account_type", "phone", "username"];
    const allowedCamel = ["accountStatus", "accountType", "phone", "username"];
    const updates = {};

    for (const key of allowedSnake) {
      if (req.body[key] !== undefined) {
        if (key === "account_status") {
          const validStatuses = ["active", "inactive", "locked"];
          if (!validStatuses.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_status. Must be one of: ${validStatuses.join(", ")}`,
            });
          }
        }
        if (key === "account_type") {
          const validTypes = ["customer", "admin", "staff"];
          if (!validTypes.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_type. Must be one of: ${validTypes.join(", ")}`,
            });
          }
        }
        if (key === "phone" && req.body[key]) {
          const phoneError = validatePhone(req.body[key]);
          if (phoneError) {
            return res.status(400).json({ success: false, message: phoneError });
          }
        }
        if (key === "username" && req.body[key]) {
          const existingUsername = await Account.findOne({
            username: req.body[key].trim(),
            _id: { $ne: id },
          });
          if (existingUsername) {
            return res.status(400).json({
              success: false,
              message: "Username already exists",
            });
          }
        }
        updates[key] = req.body[key];
      }
    }

    for (const key of allowedCamel) {
      if (req.body[key] !== undefined && updates[key.replace(/([A-Z])/g, "_$1").toLowerCase()] === undefined) {
        const snakeKey =
          key === "accountStatus"
            ? "account_status"
            : key === "accountType"
              ? "account_type"
              : key;
        if (snakeKey === "account_status") {
          const validStatuses = ["active", "inactive", "locked"];
          if (!validStatuses.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_status. Must be one of: ${validStatuses.join(", ")}`,
            });
          }
        }
        if (snakeKey === "account_type") {
          const validTypes = ["customer", "admin", "staff"];
          if (!validTypes.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid account_type. Must be one of: ${validTypes.join(", ")}`,
            });
          }
        }
        if (key === "phone" && req.body[key]) {
          const phoneError = validatePhone(req.body[key]);
          if (phoneError) {
            return res.status(400).json({ success: false, message: phoneError });
          }
        }
        if (key === "username" && req.body[key]) {
          const existingUsername = await Account.findOne({
            username: req.body[key].trim(),
            _id: { $ne: id },
          });
          if (existingUsername) {
            return res.status(400).json({
              success: false,
              message: "Username already exists",
            });
          }
        }
        updates[snakeKey] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const account = await Account.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select(PUBLIC_FIELDS);

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account patched successfully",
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  patchAccount,
  deleteAccount,
};
