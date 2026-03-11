const express = require("express");
const {
  registerReader,
  loginReader,
  getReaderProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOTP
} = require("../controllers/readerController");
const authReader = require("../middleware/authReader");

const router = express.Router();

// Public routes
router.post("/register", registerReader);
router.post("/login", loginReader);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// Protected routes (require authentication)
router.get("/profile", authReader, getReaderProfile);
router.put("/profile", authReader, updateProfile);
router.put("/change-password", authReader, changePassword);

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Readers route working ✅" });
});

module.exports = router;