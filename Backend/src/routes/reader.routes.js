const express = require("express");
const db = require("../config/db");
const {
  registerReader,
  verifyRegisterOTP,
  loginReader,
  verifyLoginOTP,
  getReaderProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOTP,
  getReaderStats,
  getReaderNotifications
} = require("../controllers/readerController");
const { uploadBook, uploadAvatar } = require("../config/upload");
const authReader = require("../middleware/authReader");

const router = express.Router();

// Public routes
router.post("/register", registerReader);
router.post("/verify-register-otp", verifyRegisterOTP);
router.post("/login", loginReader);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// Protected routes (require authentication)
router.get("/profile", authReader, getReaderProfile);
router.put("/profile", authReader, updateProfile);
router.put("/change-password", authReader, changePassword);
router.post("/upload-avatar", authReader, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const imagePath = `uploads/avatars/${req.file.filename}`;
    db.query("UPDATE readers SET profile_image = ? WHERE reader_id = ?",
      [imagePath, req.user.reader_id], (dbErr) => {
        if (dbErr) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true, profileImage: imagePath });
      });
  });
});
router.post("/logout", authReader, (req, res) => {
  console.log("Reader logout called for reader_id:", req.user.reader_id);
  db.query("UPDATE readers SET last_seen = NULL WHERE reader_id = ?", [req.user.reader_id], (err) => {
    if (err) console.error("Logout DB error:", err.message);
    else console.log("Reader", req.user.reader_id, "last_seen cleared");
    res.json({ success: true });
  });
});
router.get("/stats", authReader, getReaderStats);
router.get("/notifications", authReader, getReaderNotifications);

// GET /api/readers/ping — updates last_seen (heartbeat)
router.get("/ping", authReader, (req, res) => {
  res.json({ success: true });
});

router.get("/test", (req, res) => {
  res.json({ message: "Readers route working ✅" });
});

module.exports = router;