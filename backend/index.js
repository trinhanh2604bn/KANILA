require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectDB().then(async () => {
  // Remove uniqueness enforcement on productCode (see request to remove
  // "product code already exists" behavior).
  const dropProductCodeUniqueIndex = require("./config/dropProductCodeUniqueIndex");
  await dropProductCodeUniqueIndex();

  // Ensure default admin account exists
  const ensureAdminAccount = require("./config/initAdmin");
  await ensureAdminAccount();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

