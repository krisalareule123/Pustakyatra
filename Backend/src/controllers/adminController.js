const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const db     = require("../config/db");

// POST /api/admin/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    db.query(
      "SELECT * FROM admins WHERE email = ? AND is_active = 1",
      [email.trim()],
      async (err, rows) => {
        if (err) {
          console.error("Admin login DB error:", err.message);
          return res.status(500).json({ success: false, message: "Server error" });
        }

        if (!rows || rows.length === 0) {
          return res.status(401).json({ success: false, message: "Invalid credentials or account inactive" });
        }

        const admin = rows[0];
        const valid = await bcrypt.compare(password, admin.password);

        if (!valid) {
          return res.status(401).json({ success: false, message: "Incorrect password" });
        }

        const token = jwt.sign(
          { admin_id: admin.admin_id, email: admin.email, role: admin.role },
          process.env.JWT_SECRET,
          { expiresIn: "8h" }
        );

        res.status(200).json({
          success: true,
          message: "Admin login successful",
          token,
          admin: {
            admin_id:  admin.admin_id,
            full_name: admin.full_name,
            email:     admin.email,
            role:      admin.role,
          }
        });
      }
    );
  } catch (error) {
    console.error("adminLogin error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/admin/me  (protected)
const getAdminProfile = (req, res) => {
  db.query(
    "SELECT admin_id, full_name, email, role, is_active, created_at FROM admins WHERE admin_id = ?",
    [req.admin.admin_id],
    (err, rows) => {
      if (err || !rows.length) {
        return res.status(404).json({ success: false, message: "Admin not found" });
      }
      res.status(200).json({ success: true, admin: rows[0] });
    }
  );
};

// GET /api/admin/stats  (protected)
const getDashboardStats = (req, res) => {
  const queries = {
    totalUsers:    "SELECT COUNT(*) AS val FROM readers",
    totalAuthors:  "SELECT COUNT(*) AS val FROM authors WHERE is_verified = 1",
    totalBooks:    "SELECT COUNT(*) AS val FROM books",
    publishedBooks:"SELECT COUNT(*) AS val FROM books WHERE status = 'published'",
    draftBooks:    "SELECT COUNT(*) AS val FROM books WHERE status = 'draft'",
    totalOrders:   "SELECT COUNT(*) AS val FROM orders WHERE status = 'paid'",
    totalRevenue:  "SELECT COALESCE(SUM(total_amount), 0) AS val FROM orders WHERE status = 'paid'",
    totalReviews:  "SELECT COUNT(*) AS val FROM reviews",
  };

  const keys   = Object.keys(queries);
  const results = {};
  let done = 0;

  keys.forEach(key => {
    db.query(queries[key], (err, rows) => {
      if (err) {
        console.error(`Stats query error [${key}]:`, err.message);
        results[key] = 0;
      } else {
        results[key] = parseFloat(rows[0].val) || 0;
      }
      done++;
      if (done === keys.length) {
        res.status(200).json({ success: true, stats: results });
      }
    });
  });
};

// GET /api/admin/recent  (protected) — recent users, authors, payments
const getRecentActivity = (req, res) => {
  const results = {};
  let done = 0;
  const finish = () => { if (++done === 3) res.status(200).json({ success: true, ...results }); };

  // Recent readers
  db.query(
    `SELECT reader_id, full_name, email, created_at
     FROM readers ORDER BY created_at DESC LIMIT 5`,
    (err, rows) => {
      results.recentUsers = err ? [] : rows.map(r => ({
        id: r.reader_id, name: r.full_name, email: r.email,
        joined: r.created_at
      }));
      finish();
    }
  );

  // Recent authors with book count
  db.query(
    `SELECT a.author_id, a.full_name, a.email, a.created_at,
            COUNT(b.book_id) AS book_count
     FROM authors a
     LEFT JOIN books b ON b.author_id = a.author_id
     WHERE a.is_verified = 1
     GROUP BY a.author_id
     ORDER BY a.created_at DESC LIMIT 5`,
    (err, rows) => {
      results.recentAuthors = err ? [] : rows.map(r => ({
        id: r.author_id, name: r.full_name, email: r.email,
        books: r.book_count, joined: r.created_at
      }));
      finish();
    }
  );

  // Recent PAID payments only — join readers and order_items for book title
  db.query(
    `SELECT o.order_id, o.total_amount, o.paid_at,
            r.full_name AS reader_name,
            oi.book_title, oi.item_type
     FROM orders o
     JOIN readers r ON r.reader_id = o.reader_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     WHERE o.status = 'paid'
     ORDER BY o.paid_at DESC LIMIT 10`,
    (err, rows) => {
      results.recentPayments = err ? [] : rows.map(r => ({
        orderId:    r.order_id,
        reader:     r.reader_name,
        book:       r.book_title,
        type:       r.item_type,
        amount:     parseFloat(r.total_amount),
        status:     "paid",
        date:       r.paid_at
      }));
      finish();
    }
  );
};

// GET /api/admin/analytics  (protected)
const getAnalytics = (req, res) => {
  const queries = {
    // Summary
    totalUsers:    "SELECT COUNT(*) AS val FROM readers",
    totalAuthors:  "SELECT COUNT(*) AS val FROM authors WHERE is_verified = 1",
    totalBooks:    "SELECT COUNT(*) AS val FROM books",
    totalOrders:   "SELECT COUNT(*) AS val FROM orders WHERE status = 'paid'",
    totalRevenue:  "SELECT COALESCE(SUM(total_amount), 0) AS val FROM orders WHERE status = 'paid'",
    totalReviews:  "SELECT COUNT(*) AS val FROM reviews",

    // Buy vs Rent
    buyOrders:  "SELECT COUNT(*) AS val FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'paid' AND oi.item_type = 'buy'",
    rentOrders: "SELECT COUNT(*) AS val FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'paid' AND oi.item_type = 'rent'",

    // Rating distribution
    r5: "SELECT COUNT(*) AS val FROM reviews WHERE rating = 5",
    r4: "SELECT COUNT(*) AS val FROM reviews WHERE rating = 4",
    r3: "SELECT COUNT(*) AS val FROM reviews WHERE rating = 3",
    r2: "SELECT COUNT(*) AS val FROM reviews WHERE rating = 2",
    r1: "SELECT COUNT(*) AS val FROM reviews WHERE rating = 1",

    // Published vs Draft
    publishedBooks: "SELECT COUNT(*) AS val FROM books WHERE status = 'published'",
    draftBooks:     "SELECT COUNT(*) AS val FROM books WHERE status = 'draft'",
  };

  const keys = Object.keys(queries);
  const results = {};
  let done = 0;

  keys.forEach(key => {
    db.query(queries[key], (err, rows) => {
      results[key] = err ? 0 : (parseFloat(rows[0].val) || 0);
      if (++done === keys.length) {
        res.status(200).json({ success: true, analytics: results });
      }
    });
  });
};

// ── Admin notification helper (called from other controllers) ──────────────────
const createAdminNotification = (type, message, relatedId = null) => {
  db.query(
    "INSERT INTO admin_notifications (type, message, related_id) VALUES (?, ?, ?)",
    [type, message, relatedId],
    (err) => { if (err) console.error("Admin notification insert error:", err.message); }
  );
};

// GET /api/admin/notifications  (protected)
const getAdminNotifications = (req, res) => {
  db.query(
    `SELECT notification_id, type, message, related_id, is_read, created_at
     FROM admin_notifications
     ORDER BY created_at DESC
     LIMIT 100`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      const unread = rows.filter(r => !r.is_read).length;
      res.status(200).json({ success: true, notifications: rows, unread });
    }
  );
};

// PATCH /api/admin/notifications/read-all  (protected)
const markAllAdminNotificationsRead = (req, res) => {
  db.query("UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0", (err) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.status(200).json({ success: true });
  });
};

// PATCH /api/admin/notifications/:id/read  (protected)
const markAdminNotificationRead = (req, res) => {
  db.query(
    "UPDATE admin_notifications SET is_read = 1 WHERE notification_id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({ success: true });
    }
  );
};

module.exports = {
  adminLogin, getAdminProfile, getDashboardStats, getRecentActivity,
  getAnalytics,
  getAdminNotifications, markAllAdminNotificationsRead, markAdminNotificationRead,
  createAdminNotification
};
