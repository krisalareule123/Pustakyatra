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
    totalUsers:         "SELECT COUNT(*) AS val FROM readers",
    totalAuthors:       "SELECT COUNT(*) AS val FROM authors WHERE is_verified = 1",
    totalBooks:         "SELECT COUNT(*) AS val FROM books",
    totalOrders:        "SELECT COUNT(*) AS val FROM orders WHERE status = 'paid'",
    totalRevenue:       "SELECT COALESCE(SUM(total_amount), 0) AS val FROM orders WHERE status = 'paid'",
    platformCommission: "SELECT COALESCE(SUM(oi.admin_commission), 0) AS val FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'paid'",
    authorPayouts:      "SELECT COALESCE(SUM(oi.author_earnings), 0) AS val FROM order_items oi JOIN orders o ON o.order_id = oi.order_id WHERE o.status = 'paid'",
    totalReviews:       "SELECT COUNT(*) AS val FROM reviews",

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

// GET /api/admin/payments  (protected)
const getPayments = (req, res) => {
  db.query(
    `SELECT o.order_id, o.total_amount, o.status, o.paid_at, o.created_at,
            o.transaction_code,
            r.full_name AS reader_name,
            oi.book_title, oi.item_type
     FROM orders o
     JOIN readers r ON r.reader_id = o.reader_id
     LEFT JOIN order_items oi ON oi.order_id = o.order_id
     WHERE o.status = 'paid'
     ORDER BY o.paid_at DESC
     LIMIT 100`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      const totalRevenue = rows
        .filter(r => r.status === "paid")
        .reduce((s, r) => s + parseFloat(r.total_amount || 0), 0);
      res.status(200).json({
        success: true,
        totalRevenue,
        payments: rows.map(r => ({
          id:        r.order_id,
          txCode:    r.transaction_code || "—",
          reader:    r.reader_name,
          book:      r.book_title || "—",
          type:      r.item_type || "—",
          amount:    parseFloat(r.total_amount),
          status:    r.status,
          date:      r.paid_at || r.created_at,
        }))
      });
    }
  );
};

// GET /api/admin/books  (protected)
const getBooks = (req, res) => {
  db.query(
    `SELECT b.book_id, b.title, b.category, b.buy_price, b.rent_price,
            b.status, b.created_at,
            a.full_name AS author_name
     FROM books b
     LEFT JOIN authors a ON a.author_id = b.author_id
     ORDER BY b.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({
        success: true,
        books: rows.map(r => ({
          id:        r.book_id,
          title:     r.title,
          author:    r.author_name || "Unknown",
          category:  r.category,
          buyPrice:  r.buy_price,
          rentPrice: r.rent_price,
          status:    r.status,
          uploaded:  r.created_at,
        }))
      });
    }
  );
};

// PATCH /api/admin/books/:id/publish  (protected)
const publishBook = (req, res) => {
  db.query("UPDATE books SET status = 'published' WHERE book_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true });
  });
};

// PATCH /api/admin/books/:id/hide  (protected)
const hideBook = (req, res) => {
  db.query("UPDATE books SET status = 'draft' WHERE book_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true });
  });
};

// GET /api/admin/authors  (protected)
const getAuthors = (req, res) => {
  db.query(
    `SELECT a.author_id, a.full_name, a.email, a.last_seen, a.created_at,
            COUNT(b.book_id) AS total_books,
            SUM(b.status = 'published') AS published_books,
            SUM(b.status = 'draft') AS draft_books
     FROM authors a
     LEFT JOIN books b ON b.author_id = a.author_id
     WHERE a.is_verified = 1
     GROUP BY a.author_id
     ORDER BY a.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      const now = new Date();
      res.status(200).json({
        success: true,
        authors: rows.map(r => ({
          id:        r.author_id,
          name:      r.full_name,
          email:     r.email,
          isActive:  r.last_seen ? (now - new Date(r.last_seen)) < 5 * 60 * 1000 : false,
          books:     r.total_books || 0,
          published: r.published_books || 0,
          drafts:    r.draft_books || 0,
          joined:    r.created_at,
        }))
      });
    }
  );
};

// GET /api/admin/users  (protected)
const getUsers = (req, res) => {
  db.query(
    `SELECT reader_id, full_name, email, phone, is_active, is_blocked, last_seen, created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.reader_id = readers.reader_id AND o.status = 'paid') AS order_count
     FROM readers
     ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      const now = new Date();
      res.status(200).json({
        success: true,
        users: rows.map(r => {
          // Active = last_seen within 2 minutes
          const isOnline = r.last_seen
            ? (now - new Date(r.last_seen)) < 2 * 60 * 1000
            : false;
          return {
            id:        r.reader_id,
            name:      r.full_name,
            email:     r.email,
            phone:     r.phone,
            isActive:  isOnline,
            isBlocked: r.is_blocked,
            orders:    r.order_count,
            joined:    r.created_at,
          };
        })
      });
    }
  );
};

// PATCH /api/admin/users/:id/toggle  (protected)
const toggleUserStatus = (req, res) => {
  const { id } = req.params;
  db.query("SELECT is_blocked, full_name FROM readers WHERE reader_id = ?", [id], (err, rows) => {
    if (err || !rows.length) return res.status(404).json({ success: false, message: "User not found" });
    const newStatus = rows[0].is_blocked ? 0 : 1;
    db.query("UPDATE readers SET is_blocked = ? WHERE reader_id = ?", [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "Server error" });
      createAdminNotification(
        newStatus ? "user_blocked" : "user_unblocked",
        `Reader "${rows[0].full_name}" was ${newStatus ? "blocked" : "unblocked"} by admin.`,
        id
      );
      res.status(200).json({ success: true, isBlocked: newStatus });
    });
  });
};

// GET /api/admin/reviews  (protected)
const getAdminReviews = (req, res) => {
  db.query(
    `SELECT r.review_id, r.rating, r.comment, r.status, r.review_type, r.created_at,
            rd.full_name AS reader_name,
            b.title AS book_title
     FROM reviews r
     JOIN readers rd ON rd.reader_id = r.reader_id
     JOIN books b ON b.book_id = r.book_id
     ORDER BY r.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({ success: true, reviews: rows });
    }
  );
};

// PATCH /api/admin/reviews/:id/status  (protected)
const updateReviewStatus = (req, res) => {
  const { status } = req.body; // 'visible' | 'hidden' | 'pending'
  if (!["visible","hidden","pending"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  db.query("UPDATE reviews SET status = ? WHERE review_id = ?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true });
  });
};

// DELETE /api/admin/reviews/:id  (protected)
const deleteAdminReview = (req, res) => {
  db.query("DELETE FROM reviews WHERE review_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    res.json({ success: true });
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
  getUsers, toggleUserStatus,
  getBooks, publishBook, hideBook,
  getPayments,
  getAuthors,
  getAdminReviews, updateReviewStatus, deleteAdminReview,
  getAdminNotifications, markAllAdminNotificationsRead, markAdminNotificationRead,
  createAdminNotification
};
