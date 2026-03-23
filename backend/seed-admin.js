/**
 * Seed script: Create a demo admin account
 *
 * Usage: npm run seed:admin
 *
 * Idempotent — safe to run multiple times.
 * If admin@kanila.com already exists, skips creation.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Account = require("./models/account.model");

const ADMIN_EMAIL = "admin@kanila.com";
const ADMIN_PASSWORD = "Admin@123456";

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.\n");

    // Check if already exists
    const existing = await Account.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("Admin account already exists:");
      console.log("  _id:          ", existing._id);
      console.log("  email:        ", existing.email);
      console.log("  account_type: ", existing.account_type);
      console.log("  status:       ", existing.account_status);

      // Fix account_type/status if needed
      let updated = false;
      if (existing.account_type !== "admin") {
        existing.account_type = "admin";
        updated = true;
      }
      if (existing.account_status !== "active") {
        existing.account_status = "active";
        updated = true;
      }
      if (updated) {
        await existing.save();
        console.log("\n  → Fixed account_type/status to admin/active");
      } else {
        console.log("\n  No changes needed.");
      }
    } else {
      // Hash password using same method as auth.controller.js
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const account = await Account.create({
        email: ADMIN_EMAIL,
        password_hash,
        account_type: "admin",
        account_status: "active",
        username: "Kanila Admin",
      });

      console.log("Admin account created successfully!");
      console.log("  _id:          ", account._id);
      console.log("  email:        ", account.email);
      console.log("  account_type: ", account.account_type);
      console.log("  status:       ", account.account_status);
    }

    console.log("\n--- Login credentials ---");
    console.log("  Email:    ", ADMIN_EMAIL);
    console.log("  Password: ", ADMIN_PASSWORD);
    console.log("  Endpoint:  POST /api/auth/login");
    console.log("-------------------------\n");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedAdmin();
