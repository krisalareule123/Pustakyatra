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

// Mark notifications as read
router.post("/notifications/mark-read", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notifIds } = req.body; // array of notification id strings
  if (!notifIds || notifIds.length === 0) return res.json({ success: true });

  // Insert all as read (ignore duplicates)
  const values = notifIds.map(id => [readerId, String(id)]);
  db.query(
    "INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES ?",
    [values],
    () => {}
  );

  // Also mark promo_reward notifications in reader_notifications table
  const promoIds = notifIds
    .filter(id => String(id).startsWith("promo_"))
    .map(id => parseInt(String(id).replace("promo_", "")))
    .filter(id => !isNaN(id));

  if (promoIds.length > 0) {
    db.query(
      `UPDATE reader_notifications SET is_read = 1 WHERE reader_id = ? AND notification_id IN (${promoIds.map(() => "?").join(",")})`,
      [readerId, ...promoIds],
      () => {}
    );
  }

  res.json({ success: true });
});

// Promo code validation
router.post("/promo/validate", authReader, validatePromoCode);

// Mark single notification as read
router.post("/notifications/read", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notif_id } = req.body;
  if (!notif_id) return res.status(400).json({ success: false, message: "notif_id required" });

  // For promo_reward type (stored in reader_notifications table)
  if (String(notif_id).startsWith("promo_")) {
    const dbId = String(notif_id).replace("promo_", "");
    db.query(
      "UPDATE reader_notifications SET is_read = 1 WHERE notification_id = ? AND reader_id = ?",
      [dbId, readerId],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });
        res.json({ success: true });
      }
    );
  } else {
    // For computed notifications (payment, rent, expiring, expired)
    db.query(
      "INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES (?, ?)",
      [readerId, String(notif_id)],
      (err) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });
        res.json({ success: true });
      }
    );
  }
});

// Mark all notifications as read
router.post("/notifications/read-all", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notif_ids } = req.body; // array of all current notification IDs

  if (!notif_ids || !notif_ids.length) return res.json({ success: true });

  const promoIds = notif_ids.filter(id => String(id).startsWith("promo_")).map(id => String(id).replace("promo_", ""));
  const computedIds = notif_ids.filter(id => !String(id).startsWith("promo_"));

  let done = 0;
  const finish = () => { if (++done >= 2) res.json({ success: true }); };

  // Mark promo notifications
  if (promoIds.length > 0) {
    db.query(
      `UPDATE reader_notifications SET is_read = 1 WHERE reader_id = ? AND notification_id IN (${promoIds.map(() => "?").join(",")})`,
      [readerId, ...promoIds],
      () => finish()
    );
  } else { finish(); }

  // Mark computed notifications
  if (computedIds.length > 0) {
    const values = computedIds.map(id => [readerId, String(id)]);
    db.query(
      "INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES ?",
      [values],
      () => finish()
    );
  } else { finish(); }
});

// Mark all notifications as read
router.post("/notifications/mark-all-read", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notifIds } = req.body; // array of computed notification IDs
  if (!notifIds || notifIds.length === 0) return res.json({ success: true });

  // Insert all IDs — ignore duplicates
  const values = notifIds.map(id => [readerId, String(id)]);
  db.query(
    "INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES ?",
    [values],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true });
    }
  );
  // Also mark promo notifications as read in reader_notifications table
  db.query(
    "UPDATE reader_notifications SET is_read = 1 WHERE reader_id = ?",
    [readerId], () => {}
  );
});

// Mark single notification as read
router.post("/notifications/mark-read", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notifId, isPromo, promoNotifId } = req.body;
  if (isPromo && promoNotifId) {
    db.query(
      "UPDATE reader_notifications SET is_read = 1 WHERE notification_id = ? AND reader_id = ?",
      [promoNotifId, readerId],
      (err) => { if (err) return res.status(500).json({ success: false }); res.json({ success: true }); }
    );
  } else if (notifId) {
    db.query(
      "INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES (?, ?)",
      [readerId, String(notifId)],
      (err) => { if (err) return res.status(500).json({ success: false }); res.json({ success: true }); }
    );
  } else {
    res.json({ success: true });
  }
});

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
// Highlights
router.get("/highlights/:bookId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { bookId } = req.params;
  db.query(
    "SELECT highlight_id, page_number, selected_text, rects, color, created_at FROM highlights WHERE reader_id = ? AND book_id = ? ORDER BY page_number ASC, created_at DESC",
    [readerId, bookId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      // Parse rects JSON string back to array
      const highlights = rows.map(r => ({
        ...r,
        rects: r.rects ? (typeof r.rects === "string" ? JSON.parse(r.rects) : r.rects) : null
      }));
      res.json({ success: true, highlights });
    }
  );
});

router.post("/highlights", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { book_id, page_number, selected_text, rects, color } = req.body;
  if (!book_id || !page_number || !selected_text?.trim()) {
    return res.status(400).json({ success: false, message: "book_id, page_number and selected_text required" });
  }
  const rectsJson = rects ? JSON.stringify(rects) : null;
  const highlightColor = color || "yellow";
  db.query(
    "INSERT INTO highlights (reader_id, book_id, page_number, selected_text, rects, color) VALUES (?, ?, ?, ?, ?, ?)",
    [readerId, book_id, page_number, selected_text.trim(), rectsJson, highlightColor],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.json({ success: true, highlight_id: result.insertId });
    }
  );
});

router.delete("/highlights/:highlightId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { highlightId } = req.params;
  db.query(
    "DELETE FROM highlights WHERE highlight_id = ? AND reader_id = ?",
    [highlightId, readerId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Highlight not found" });
      res.json({ success: true });
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

// Mark single notification as read
router.post("/notifications/read/:notifId", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notifId } = req.params;
  if (notifId.startsWith("promo_")) {
    const dbId = notifId.replace("promo_", "");
    db.query("UPDATE reader_notifications SET is_read = 1 WHERE notification_id = ? AND reader_id = ?",
      [dbId, readerId], (err) => { if (err) return res.status(500).json({ success: false }); res.json({ success: true }); });
  } else {
    db.query("INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES (?, ?)",
      [readerId, String(notifId)], (err) => { if (err) return res.status(500).json({ success: false }); res.json({ success: true }); });
  }
});

// Mark all notifications as read
router.post("/notifications/read-all", authReader, (req, res) => {
  const readerId = req.user.reader_id;
  const { notifIds } = req.body;
  if (!notifIds || !notifIds.length) return res.json({ success: true });
  const promoIds = notifIds.filter(id => String(id).startsWith("promo_")).map(id => id.replace("promo_", ""));
  const computedIds = notifIds.filter(id => !String(id).startsWith("promo_"));
  let done = 0;
  const finish = () => { if (++done >= 2) res.json({ success: true }); };
  if (promoIds.length > 0) {
    db.query(`UPDATE reader_notifications SET is_read = 1 WHERE reader_id = ? AND notification_id IN (${promoIds.map(() => "?").join(",")})`,
      [readerId, ...promoIds], () => finish());
  } else { finish(); }
  if (computedIds.length > 0) {
    db.query("INSERT IGNORE INTO read_notifications (reader_id, notif_id) VALUES ?",
      [computedIds.map(id => [readerId, String(id)])], () => finish());
  } else { finish(); }
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