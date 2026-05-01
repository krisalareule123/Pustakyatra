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
const { validatePromoCode } = require("../controllers/promoController");

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

// Promo code validation
router.post("/promo/validate", authReader, validatePromoCode);

// Bookmarks
router.get("/bookmarks/:bookId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId } = req.params;
  db.query(
    "SELECT page_number FROM bookmarks WHERE reader_id = ? AND book_id = ? ORDER BY page_number ASC",
    [readerId, bookId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, bookmarks: rows });
    }
  );
});

router.post("/bookmarks", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { book_id, page_number } = req.body;
  if (!book_id || !page_number) return res.status(400).json({ success: false, message: "book_id and page_number required" });
  db.query(
    `INSERT IGNORE INTO bookmarks (reader_id, book_id, page_number) VALUES (?, ?, ?)`,
    [readerId, book_id, page_number],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "Bookmarked" });
    }
  );
});

router.delete("/bookmarks", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { book_id, page_number } = req.body;
  db.query(
    "DELETE FROM bookmarks WHERE reader_id = ? AND book_id = ? AND page_number = ?",
    [readerId, book_id, page_number],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, message: "Bookmark removed" });
    }
  );
});
// Notes
router.get("/notes/:bookId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId } = req.params;
  db.query(
    "SELECT note_id, page_number, note_text, created_at FROM reading_notes WHERE reader_id = ? AND book_id = ? ORDER BY page_number ASC, created_at DESC",
    [readerId, bookId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, notes: rows });
    }
  );
});

router.post("/notes", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { book_id, page_number, note_text } = req.body;
  if (!book_id || !page_number || !note_text?.trim()) {
    return res.status(400).json({ success: false, message: "book_id, page_number and note_text required" });
  }
  db.query(
    "INSERT INTO reading_notes (reader_id, book_id, page_number, note_text) VALUES (?, ?, ?, ?)",
    [readerId, book_id, page_number, note_text.trim()],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, note_id: result.insertId });
    }
  );
});

router.delete("/notes/:noteId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { noteId } = req.params;
  db.query(
    "DELETE FROM reading_notes WHERE note_id = ? AND reader_id = ?",
    [noteId, readerId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Note not found" });
      res.json({ success: true });
    }
  );
});

router.get("/reading-progress/:bookId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId } = req.params;
  db.query(
    "SELECT page_number FROM reading_progress WHERE reader_id = ? AND book_id = ?",
    [readerId, bookId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, page: rows.length > 0 ? rows[0].page_number : 1 });
    }
  );
});

router.post("/reading-progress", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId, page } = req.body;
  if (!bookId || !page) return res.status(400).json({ success: false, message: "bookId and page required" });
  db.query(
    `INSERT INTO reading_progress (reader_id, book_id, page_number)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE page_number = VALUES(page_number)`,
    [readerId, bookId, page],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true });
    }
  );
});

// GET /api/readers/ping — updates last_seen (heartbeat)
router.get("/ping", authReader, (req, res) => {
  res.json({ success: true });
});

router.get("/test", (req, res) => {
  res.json({ message: "Readers route working ✅" });
});

module.exports = router;