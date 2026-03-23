const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Account = require("../models/account.model");
const Customer = require("../models/customer.model");

// Helper: generate a simple customer code like CUS0001
const generateCustomerCode = async () => {
  const lastCustomer = await Customer.findOne().sort({ createdAt: -1 });
  
  if (!lastCustomer || !lastCustomer.customerCode) {
    return "CUS0001";
  }

  // Cắt bỏ chữ "CUS" và lấy phần số, sau đó cộng 1
  const lastNum = parseInt(lastCustomer.customerCode.replace("CUS", ""), 10);
  const nextNum = lastNum + 1;
  return `CUS${String(nextNum).padStart(4, "0")}`;
};
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { email, password, fullName, firstName, lastName, phone } = req.body;

    // Required fields check
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "email, password, and fullName are required",
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
    const passwordHash = await bcrypt.hash(password, salt);

    // Create account
    const account = await Account.create({
      email,
      phone: phone || "",
      passwordHash,
      accountType: "customer",
    });

    // Generate customer code and create customer profile
    const customerCode = await generateCustomerCode();
    const customer = await Customer.create({
      accountId: account._id,
      customerCode,
      fullName,
      firstName: firstName || "",
      lastName: lastName || "",
    });

    // Generate JWT
    const token = jwt.sign(
      { accountId: account._id, email: account.email, accountType: account.accountType },
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
          accountType: account.accountType,
        },
        customer: {
          _id: customer._id,
          customerCode: customer.customerCode,
          fullName: customer.fullName,
        },
      },
    });
  } catch (error) {
    console.log("DEBUG ERROR:", error); 
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Dữ liệu bị trùng: ${Object.keys(error.keyValue).join(", ")}`, 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }}

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
    if (account.accountStatus === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    if (account.accountStatus === "locked") {
      // Check if lock has expired
      if (account.lockedUntil && account.lockedUntil > new Date()) {
        return res.status(403).json({
          success: false,
          message: "Account is locked. Please try again later",
        });
      }
      // Lock expired, reset status
      account.accountStatus = "active";
      account.failedLoginCount = 0;
      account.lockedUntil = null;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      // Increment failed login count
      account.failedLoginCount += 1;
      await account.save();

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Successful login — update tracking fields
    account.lastLoginAt = new Date();
    account.failedLoginCount = 0;
    await account.save();

    // Get customer info
    const customer = await Customer.findOne({ accountId: account._id });

    // Generate JWT
    const token = jwt.sign(
      { accountId: account._id, email: account.email, accountType: account.accountType },
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
          accountType: account.accountType,
          lastLoginAt: account.lastLoginAt,
        },
        customer: customer
          ? {
              _id: customer._id,
              customerCode: customer.customerCode,
              fullName: customer.fullName,
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
    const account = await Account.findById(req.user.accountId).select("-passwordHash");
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const customer = await Customer.findOne({ accountId: account._id });

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

// POST /api/auth/check-email
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const account = await Account.findOne({ email });

    if (account) {
      return res.status(200).json({ success: true, exists: true, message: "Email exists" });
    } else {
      return res.status(200).json({ success: true, exists: false, message: "Email not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, newPass } = req.body;

    if (!email || !newPass) {
      return res.status(400).json({ success: false, message: "Email and new password are required" });
    }

    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    account.passwordHash = passwordHash;
    account.accountStatus = "active";
    account.failedLoginCount = 0;
    account.lockedUntil = null;

    await account.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  checkEmail,     
  resetPassword
};
