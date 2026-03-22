/**
 * Auto-initializer: ensures a default admin account exists.
 * Called once at server startup. Idempotent — skips if account already exists.
 */
const bcrypt = require("bcryptjs");
const Account = require("../models/account.model");

const ADMIN_EMAIL = "ngan@gmail.com";
const ADMIN_PASSWORD = "123456789";

const ensureAdminAccount = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    let existing = await Account.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`[init] Admin account updated with latest password: ${existing.email}`);
      return;
    }

    await Account.create({
      email: ADMIN_EMAIL,
      passwordHash,
      accountType: "admin",
      accountStatus: "active",
      username: "Kanila Admin",
    });

    console.log(`[init] Admin account created: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("[init] Failed to create admin account:", error.message);
  }
};

module.exports = ensureAdminAccount;
