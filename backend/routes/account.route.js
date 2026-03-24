const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  getAllAccounts,
  getAccountById,
  getProfileHub,
  patchMyProfile,
  getMySkinProfile,
  patchMySkinProfile,
  getMyAddresses,
  postMyAddress,
  patchMyAddress,
  deleteMyAddress,
  patchMyDefaultAddress,
  changeMyPassword,
  getMyProviders,
  createAccount,
  updateAccount,
  patchAccount,
  deleteAccount,
} = require("../controllers/account.controller");

router.get("/profile-hub", authMiddleware, getProfileHub);
router.patch("/profile", authMiddleware, patchMyProfile);
router.get("/skin-profile", authMiddleware, getMySkinProfile);
router.patch("/skin-profile", authMiddleware, patchMySkinProfile);
router.post("/addresses", authMiddleware, postMyAddress);
router.get("/addresses", authMiddleware, getMyAddresses);
router.patch("/addresses/:id/default", authMiddleware, patchMyDefaultAddress);
router.patch("/addresses/:id", authMiddleware, patchMyAddress);
router.delete("/addresses/:id", authMiddleware, deleteMyAddress);
router.post("/change-password", authMiddleware, changeMyPassword);
router.get("/providers", authMiddleware, getMyProviders);

router.get("/", getAllAccounts);
router.post("/", createAccount);
router.get("/:id", getAccountById);
router.put("/:id", updateAccount);
router.patch("/:id", patchAccount);
router.delete("/:id", deleteAccount);

module.exports = router;
