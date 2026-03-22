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
      console.log("  _id:         ", existing._id);
      console.log("  email:       ", existing.email);
      console.log("  accountType: ", existing.accountType);
      console.log("  status:      ", existing.accountStatus);

      // Fix accountType/status if needed
      let updated = false;
      if (existing.accountType !== "admin") {
        existing.accountType = "admin";
        updated = true;
      }
      if (existing.accountStatus !== "active") {
        existing.accountStatus = "active";
        updated = true;
      }
      if (updated) {
        await existing.save();
        console.log("\n  → Fixed accountType/status to admin/active");
      } else {
        console.log("\n  No changes needed.");
      }
    } else {
      // Hash password using same method as auth.controller.js
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

      const account = await Account.create({
        email: ADMIN_EMAIL,
        passwordHash,
        accountType: "admin",
        accountStatus: "active",
        username: "Kanila Admin",
      });

      console.log("Admin account created successfully!");
      console.log("  _id:         ", account._id);
      console.log("  email:       ", account.email);
      console.log("  accountType: ", account.accountType);
      console.log("  status:      ", account.accountStatus);
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
