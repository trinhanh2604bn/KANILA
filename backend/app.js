const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Common middlewares
app.use(cors());
// Allow larger payloads for base64 imageUrl submitted from the admin product form.
// Default Express limit is ~100kb which breaks product creation when images are attached.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Direct POST handler for accounts (bypasses router chain)
const { createAccount: createAccountHandler } = require("./controllers/account.controller");
app.post("/api/accounts", createAccountHandler);

// Mount routes
app.use("/api", routes);

// Not found middleware
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

module.exports = app;
