const express = require("express");
const jwt = require("jsonwebtoken");
const db  = require("../config/db");
const { uploadAvatar } = require("../config/upload");
const {
  registerAuthor, verifyAuthorEmail, resendAuthorOTP,
  loginAuthor, getAuthorProfile, updateAuthorProfile, changeAuthorPassword,
  getAuthorStats, getAuthorBook, getAuthorBooks,
  getAuthorReviews, getNotifications, markNotificationRead, getPublicAuthors, getAuthorPublicBooks
} = require("../controllers/authorController");
const { createPromoCode, getAuthorPromoCodes, deletePromoCode, updatePromoCode } = require("../controllers/promoController");

const router = express.Router();

// Auth middleware for authors
const authAuthor = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Access denied. Please login." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.author_id) return res.status(401).json({ success: false, message: "Invalid author token." });
    req.user = decoded;
    // Mark author last_seen on every authenticated request — skip on logout
    if (req.path !== "/logout") {
      db.query("UPDATE authors SET last_seen = NOW() WHERE author_id = ?", [decoded.author_id], () => {});
    }
    next();
  } catch (error) {
    const msg = error.name === "TokenExpiredError"
      ? "Session expired. Please login again."
      : "Invalid token. Please login again.";
    res.status(401).json({ success: false, message: msg });
  }
};

// Public routes (no auth needed)
router.get("/public", getPublicAuthors);
router.get("/:authorId/books", getAuthorPublicBooks);
router.post("/register", registerAuthor);
router.post("/verify-email", verifyAuthorEmail);
router.post("/resend-otp", resendAuthorOTP);
router.post("/login", loginAuthor);

// Protected
router.get("/me", authAuthor, getAuthorProfile);
router.post("/upload-avatar", authAuthor, (req, res) => {
  uploadAvatar(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const imagePath = `uploads/avatars/${req.file.filename}`;
    db.query("UPDATE authors SET profile_image = ? WHERE author_id = ?",
      [imagePath, req.user.author_id], (dbErr) => {
        if (dbErr) return res.status(500).json({ success: false, message: "DB error" });
        res.json({ success: true, profileImage: imagePath });
      });
  });
});
router.post("/logout", authAuthor, (req, res) => {
  db.query("UPDATE authors SET last_seen = NULL WHERE author_id = ?", [req.user.author_id], (err) => {
    if (err) console.error("Author logout DB error:", err.message);
    res.json({ success: true });
  });
});
router.put("/me", authAuthor, updateAuthorProfile);
router.put("/change-password", authAuthor, changeAuthorPassword);
router.get("/stats", authAuthor, getAuthorStats);
router.get("/books", authAuthor, getAuthorBooks);
router.get("/books/:bookId", authAuthor, getAuthorBook);
router.get("/reviews", authAuthor, getAuthorReviews);
router.get("/notifications", authAuthor, getNotifications);
router.patch("/notifications/:id/read", authAuthor, markNotificationRead);

// Promo Codes
router.get("/promo-codes", authAuthor, getAuthorPromoCodes);
router.post("/promo-codes", authAuthor, createPromoCode);
router.put("/promo-codes/:id", authAuthor, updatePromoCode);
router.delete("/promo-codes/:id", authAuthor, deletePromoCode);

module.exports = router;
