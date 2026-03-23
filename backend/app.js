const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// Common middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
