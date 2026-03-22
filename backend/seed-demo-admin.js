const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const Account = require("./models/account.model");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for admin seeding");

    const email = "admin@gmail.com";
    const password = "admin1234";

    let account = await Account.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (account) {
      account.passwordHash = passwordHash;
      account.accountType = "admin";
      account.accountStatus = "active";
      await account.save();
      console.log("Admin account updated.");
    } else {
      account = await Account.create({
        email,
        passwordHash,
        accountType: "admin",
        accountStatus: "active",
        username: "Kanila Admin",
      });
      console.log("Admin account created.");
    }
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
