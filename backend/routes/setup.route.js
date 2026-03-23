const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Account = require("../models/account.model");

/**
 * GET /api/setup/admin
 * Creates the default admin account. Idempotent.
 * Visit http://localhost:5000/api/setup/admin in your browser.
 */
router.get("/admin", async (req, res) => {
  try {
    const email = "admin@kanila.com";
    const password = "Admin@123456";

    const existing = await Account.findOne({ email });
    if (existing) {
      // Ensure it's admin + active
      existing.account_type = "admin";
      existing.account_status = "active";
      await existing.save();

      return res.json({
        success: true,
        message: "Admin account already exists (verified admin + active)",
        data: { email, password, account_type: "admin" },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const account = await Account.create({
      email,
      password_hash,
      account_type: "admin",
      account_status: "active",
      username: "Kanila Admin",
    });

    res.json({
      success: true,
      message: "Admin account created!",
      data: {
        _id: account._id,
        email,
        password,
        account_type: "admin",
        loginEndpoint: "POST /api/auth/login",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
