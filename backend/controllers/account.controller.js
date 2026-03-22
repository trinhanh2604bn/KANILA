const Account = require("../models/account.model");
const validateObjectId = require("../utils/validateObjectId");
const bcrypt = require("bcryptjs");

// Validation utilities
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
  if (!phone) return null; // Phone is optional
  const phoneRegex = /^[0-9\-\+\(\)\s]{10,}$/;
  return phoneRegex.test(phone) ? null : "Invalid phone format";
};

// GET /api/accounts
const getAllAccounts = async (req, res) => {
  try {
    const accounts = await Account.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

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

    const account = await Account.findById(id).select("-passwordHash");

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
    const { email, password, accountType, username, phone, accountStatus } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Validate phone if provided
    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        return res.status(400).json({
          success: false,
          message: phoneError,
        });
      }
    }

    // Validate accountType
    const validAccountTypes = ['customer', 'admin', 'staff'];
    if (accountType && !validAccountTypes.includes(accountType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account type. Must be one of: ${validAccountTypes.join(', ')}`,
      });
    }

    // Validate accountStatus
    const validStatuses = ['active', 'inactive', 'locked'];
    if (accountStatus && !validStatuses.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid account status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Convert email to lowercase BEFORE checking duplicates
    const emailLower = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await Account.findOne({ email: emailLower });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check duplicate username if provided
    if (username) {
      const existingUsername = await Account.findOne({ username: username.trim() });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const account = await Account.create({
      email: emailLower,
      passwordHash,
      accountType: accountType || 'customer',
      username: username ? username.trim() : '',
      phone: phone ? phone.trim() : '',
      accountStatus: accountStatus || 'active',
    });

    // Return without passwordHash
    const result = account.toObject();
    delete result.passwordHash;

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

    // Prevent password update through this endpoint
    delete req.body.passwordHash;

    const account = await Account.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

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
    delete result.passwordHash;

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

    const allowed = ["accountStatus", "accountType", "phone", "username"];
    const updates = {};

    // Validate and filter allowed fields
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        // Validate accountStatus
        if (key === "accountStatus") {
          const validStatuses = ['active', 'inactive', 'locked'];
          if (!validStatuses.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid accountStatus. Must be one of: ${validStatuses.join(', ')}`,
            });
          }
        }

        // Validate accountType
        if (key === "accountType") {
          const validTypes = ['customer', 'admin', 'staff'];
          if (!validTypes.includes(req.body[key])) {
            return res.status(400).json({
              success: false,
              message: `Invalid accountType. Must be one of: ${validTypes.join(', ')}`,
            });
          }
        }

        // Validate phone
        if (key === "phone" && req.body[key]) {
          const phoneError = validatePhone(req.body[key]);
          if (phoneError) {
            return res.status(400).json({
              success: false,
              message: phoneError,
            });
          }
        }

        // Validate username uniqueness
        if (key === "username" && req.body[key]) {
          const existingUsername = await Account.findOne({
            username: req.body[key].trim(),
            _id: { $ne: id }
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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const account = await Account.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

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
