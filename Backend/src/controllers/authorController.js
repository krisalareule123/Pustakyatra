const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendOTPEmail, sendAuthorWelcomeEmail } = require("../config/email");

const genOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (author) =>
  jwt.sign(
    { author_id: author.author_id, email: author.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// POST /api/authors/register
const registerAuthor = async (req, res) => {
  try {
    const { fullName, email, password, phone, bio } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    db.query("SELECT author_id, is_verified FROM authors WHERE email = ?", [email.trim()], async (err, rows) => {
      if (err) {
        console.error("DB error (register author):", err.message);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (rows.length > 0) {
        const existing = rows[0];
        if (!existing.is_verified) {
          // Resend OTP for unverified account
          const otp = genOTP();
          db.query(
            "UPDATE authors SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?",
            [otp, email.trim()],
            () => sendOTPEmail(email.trim(), fullName.trim(), otp).catch(() => {})
          );
          return res.status(200).json({
            success: true,
            requiresOTP: true,
            message: "Account already exists but is not verified. A new OTP has been sent to your email.",
            email: email.trim()
          });
        }
        return res.status(400).json({ success: false, message: "An account with this email already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const otp = genOTP();

      db.query(
        `INSERT INTO authors (full_name, email, password, phone, bio, otp_code, otp_expiry, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)`,
        [fullName.trim(), email.trim(), hashed, phone || null, bio || null, otp],
        (err2) => {
          if (err2) {
            console.error("DB error inserting author:", err2.message);
            return res.status(500).json({ success: false, message: "Failed to create account" });
          }

          sendOTPEmail(email.trim(), fullName.trim(), otp).catch(() => {});

          res.status(201).json({
            success: true,
            requiresOTP: true,
            message: "Account created! Please check your email for the verification OTP.",
            email: email.trim()
          });
        }
      );
    });
  } catch (error) {
    console.error("registerAuthor error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// POST /api/authors/verify-email
const verifyAuthorEmail = (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    db.query(
      "SELECT * FROM authors WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()",
      [email.trim(), otp.trim()],
      (err, rows) => {
        if (err) {
          console.error("DB error (verify author email):", err.message);
          return res.status(500).json({ success: false, message: "Server error. Please try again later" });
        }

        if (rows.length === 0) {
          return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please try again." });
        }

        const author = rows[0];

        db.query(
          "UPDATE authors SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE author_id = ?",
          [author.author_id],
          (err2) => {
            if (err2) {
              console.error("DB error verifying author:", err2.message);
              return res.status(500).json({ success: false, message: "Server error. Please try again later" });
            }

            // Send welcome email after successful verification (non-blocking)
            sendAuthorWelcomeEmail(author.email, author.full_name).catch(() => {});

            const token = signToken(author);

            res.status(200).json({
              success: true,
              message: "Email verified! Welcome to Pustakyatra.",
              token,
              author: {
                author_id: author.author_id,
                fullName: author.full_name,
                email: author.email
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("verifyAuthorEmail error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// POST /api/authors/resend-otp
const resendAuthorOTP = (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    db.query("SELECT * FROM authors WHERE email = ?", [email.trim()], (err, rows) => {
      if (err) {
        console.error("DB error (resend author OTP):", err.message);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "No account found with this email" });
      }

      const author = rows[0];

      if (author.is_verified) {
        return res.status(400).json({ success: false, message: "This account is already verified" });
      }

      const otp = genOTP();

      db.query(
        "UPDATE authors SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE author_id = ?",
        [otp, author.author_id],
        (err2) => {
          if (err2) {
            return res.status(500).json({ success: false, message: "Server error. Please try again later" });
          }

          sendOTPEmail(author.email, author.full_name, otp).catch(() => {});

          res.status(200).json({
            success: true,
            message: "A new OTP has been sent to your email."
          });
        }
      );
    });
  } catch (error) {
    console.error("resendAuthorOTP error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// POST /api/authors/login
const loginAuthor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    db.query("SELECT * FROM authors WHERE email = ?", [email.trim()], async (err, rows) => {
      if (err) {
        console.error("DB error (login author):", err.message);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "No account found with this email" });
      }

      const author = rows[0];
      const valid = await bcrypt.compare(password, author.password);

      if (!valid) {
        return res.status(401).json({ success: false, message: "Incorrect password" });
      }

      if (!author.is_verified) {
        // Resend OTP so they can verify right away
        const otp = genOTP();
        db.query(
          "UPDATE authors SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE author_id = ?",
          [otp, author.author_id],
          () => sendOTPEmail(author.email, author.full_name, otp).catch(() => {})
        );
        return res.status(403).json({
          success: false,
          requiresOTP: true,
          message: "Please verify your email before logging in. A new OTP has been sent.",
          email: author.email
        });
      }

      const token = signToken(author);

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        author: {
          author_id: author.author_id,
          fullName: author.full_name,
          email: author.email,
          phone: author.phone,
          bio: author.bio
        }
      });
    });
  } catch (error) {
    console.error("loginAuthor error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// PUT /api/authors/change-password  (protected)
const changeAuthorPassword = async (req, res) => {
  try {
    const authorId = req.user.author_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    db.query("SELECT password FROM authors WHERE author_id = ?", [authorId], async (err, rows) => {
      if (err || !rows.length) return res.status(500).json({ success: false, message: "Server error" });

      const valid = await bcrypt.compare(currentPassword, rows[0].password);
      if (!valid) return res.status(401).json({ success: false, message: "Current password is incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      db.query("UPDATE authors SET password = ? WHERE author_id = ?", [hashed, authorId], (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "Failed to update password" });
        res.status(200).json({ success: true, message: "Password changed successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/authors/public  — public list of all verified authors with book counts
function getPublicAuthors(req, res) {
  db.query(
    `SELECT a.author_id, a.full_name, a.bio,
            COUNT(b.book_id) AS book_count
     FROM authors a
     LEFT JOIN books b ON b.author_id = a.author_id AND b.status = 'published'
     WHERE a.is_verified = 1
     GROUP BY a.author_id
     ORDER BY a.created_at ASC`,
    (err, rows) => {
      if (err) {
        console.error("getPublicAuthors error:", err.message);
        return res.status(500).json({ success: false, message: "Server error" });
      }
      res.status(200).json({ success: true, authors: rows });
    }
  );
}

// GET /api/authors/:authorId/books  — public books by a specific author
function getAuthorPublicBooks(req, res) {
  const { authorId } = req.params;
  db.query(
    `SELECT b.book_id, b.title, b.nepali_title, b.category, b.buy_price, b.rent_price,
            b.rent_days, b.cover_image, b.created_at,
            a.full_name AS author_name
     FROM books b
     JOIN authors a ON a.author_id = b.author_id
     WHERE b.author_id = ? AND b.status = 'published'
     ORDER BY b.created_at DESC`,
    [authorId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({ success: true, books: rows });
    }
  );
}

// GET /api/authors/me  (protected)
const getAuthorProfile = (req, res) => {
  try {
    const authorId = req.user.author_id;

    db.query(
      "SELECT author_id, full_name, email, phone, bio, is_verified, created_at FROM authors WHERE author_id = ?",
      [authorId],
      (err, rows) => {
        if (err) {
          console.error("DB error (author profile):", err.message);
          return res.status(500).json({ success: false, message: "Server error. Please try again later" });
        }

        if (rows.length === 0) {
          return res.status(404).json({ success: false, message: "Author not found" });
        }

        const a = rows[0];
        res.status(200).json({
          success: true,
          author: {
            author_id: a.author_id,
            fullName: a.full_name,
            email: a.email,
            phone: a.phone,
            bio: a.bio,
            isVerified: !!a.is_verified,
            createdAt: a.created_at
          }
        });
      }
    );
  } catch (error) {
    console.error("getAuthorProfile error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// PUT /api/authors/me  (protected)
const updateAuthorProfile = (req, res) => {
  try {
    const authorId = req.user.author_id;
    const { fullName, phone, bio } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }

    db.query(
      "UPDATE authors SET full_name = ?, phone = ?, bio = ? WHERE author_id = ?",
      [fullName.trim(), phone || null, bio || null, authorId],
      (err) => {
        if (err) {
          console.error("DB error (update author profile):", err.message);
          return res.status(500).json({ success: false, message: "Server error. Please try again later" });
        }
        res.status(200).json({ success: true, message: "Profile updated successfully" });
      }
    );
  } catch (error) {
    console.error("updateAuthorProfile error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

module.exports = { registerAuthor, verifyAuthorEmail, resendAuthorOTP, loginAuthor, getAuthorProfile, updateAuthorProfile, changeAuthorPassword, getAuthorStats, getAuthorBook, getAuthorBooks, getAuthorReviews, getNotifications, markNotificationRead, getPublicAuthors, getAuthorPublicBooks };

// GET /api/authors/stats  (protected)
function getAuthorStats(req, res) {
  const authorId = req.user.author_id;
  const query = `
    SELECT
      COUNT(*) AS totalBooks,
      SUM(status = 'published') AS published,
      SUM(status = 'draft') AS drafts
    FROM books WHERE author_id = ?
  `;
  db.query(query, [authorId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: "Server error" });
    const stats = rows[0];

    // Earnings: sum of order_items for this author's books
    const earningsQuery = `
      SELECT COALESCE(SUM(oi.total_price), 0) AS totalEarnings
      FROM order_items oi
      JOIN books b ON b.book_id = oi.book_id
      JOIN orders o ON o.order_id = oi.order_id
      WHERE b.author_id = ? AND o.status = 'paid'
    `;
    db.query(earningsQuery, [authorId], (err2, eRows) => {
      if (err2) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({
        success: true,
        stats: {
          totalBooks: stats.totalBooks || 0,
          published: stats.published || 0,
          drafts: stats.drafts || 0,
          totalEarnings: parseFloat(eRows[0].totalEarnings) || 0
        }
      });
    });
  });
}

// GET /api/authors/books/:bookId  — full book details for edit form
function getAuthorBook(req, res) {
  const authorId = req.user.author_id;
  const { bookId } = req.params;
  db.query(
    `SELECT book_id, title, nepali_title, description, category, language,
            keywords, buy_price, rent_price, rent_days, cover_image, pdf_file, status
     FROM books WHERE book_id = ? AND author_id = ?`,
    [bookId, authorId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      if (!rows.length) return res.status(404).json({ success: false, message: "Book not found" });
      res.status(200).json({ success: true, book: rows[0] });
    }
  );
}

// GET /api/authors/books  (protected — only this author's books)
function getAuthorBooks(req, res) {
  const authorId = req.user.author_id;
  const query = `
    SELECT
      b.book_id, b.title, b.nepali_title, b.status, b.cover_image,
      b.buy_price, b.rent_price, b.created_at,
      COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN oi.order_id END) AS sales,
      COALESCE(SUM(CASE WHEN o.status = 'paid' THEN oi.total_price ELSE 0 END), 0) AS earnings
    FROM books b
    LEFT JOIN order_items oi ON oi.book_id = b.book_id
    LEFT JOIN orders o ON o.order_id = oi.order_id
    WHERE b.author_id = ?
    GROUP BY b.book_id
    ORDER BY b.created_at DESC
  `;
  db.query(query, [authorId], (err, rows) => {
    if (err) {
      console.error("getAuthorBooks error:", err.message);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    res.status(200).json({ success: true, books: rows });
  });
}

// GET /api/authors/reviews  — all reviews for this author's books
function getAuthorReviews(req, res) {
  const authorId = req.user.author_id;
  db.query(
    `SELECT r.review_id, r.book_id, r.rating, r.comment, r.created_at,
            rd.full_name AS reader_name,
            b.title AS book_title
     FROM reviews r
     JOIN books b ON b.book_id = r.book_id
     LEFT JOIN readers rd ON rd.reader_id = r.reader_id
     WHERE b.author_id = ?
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [authorId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });

      // Calculate stats
      const totalReviews = rows.length;
      const avgRating = totalReviews > 0
        ? (rows.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
        : 0;
      const ratedBooks = new Set(rows.map(r => r.book_id)).size;

      res.status(200).json({
        success: true,
        reviews: rows,
        stats: { totalReviews, avgRating: parseFloat(avgRating), ratedBooks }
      });
    }
  );
}

// GET /api/authors/notifications  (protected)
function getNotifications(req, res) {
  const authorId = req.user.author_id;
  db.query(
    `SELECT n.notification_id, n.book_id, n.type, n.message, n.is_read, n.created_at,
            rd.full_name AS reader_name
     FROM author_notifications n
     LEFT JOIN readers rd ON rd.reader_id = n.reader_id
     WHERE n.author_id = ?
     ORDER BY n.created_at DESC LIMIT 50`,
    [authorId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({ success: true, notifications: rows });
    }
  );
}

// PATCH /api/authors/notifications/:id/read  (protected)
function markNotificationRead(req, res) {
  const authorId = req.user.author_id;
  const { id } = req.params;
  db.query(
    "UPDATE author_notifications SET is_read = 1 WHERE notification_id = ? AND author_id = ?",
    [id, authorId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Server error" });
      res.status(200).json({ success: true });
    }
  );
}
