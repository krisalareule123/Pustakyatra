const mysql = require("mysql2");
require("dotenv").config();

// Use a pool instead of a single connection — handles reconnects and idle timeouts automatically
const pool = mysql.createPool({
  host:              process.env.DB_HOST,
  user:              process.env.DB_USER,
  password:          process.env.DB_PASSWORD,
  database:          process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
});

// Test connection on startup and run any pending migrations
pool.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ MySQL Connected to", process.env.DB_NAME);

  // ── Migration: add review_type and status columns to reviews table ──────────
  // Safe to run multiple times — uses IF NOT EXISTS / IGNORE
  const migrations = [
    `ALTER TABLE reviews
       ADD COLUMN IF NOT EXISTS review_type ENUM('public','private') NOT NULL DEFAULT 'public',
       ADD COLUMN IF NOT EXISTS status ENUM('pending','visible','hidden') NOT NULL DEFAULT 'visible'`,
    // Mark all existing reviews as public + visible so they still appear
    `UPDATE reviews SET review_type = 'public', status = 'visible'
     WHERE review_type = 'public' AND status != 'visible'`,
    // Drop old unique key if it exists (ignore error if it doesn't)
    `ALTER TABLE reviews DROP INDEX unique_reader_book`,
    // Add new unique key allowing one public + one private per reader per book
    `ALTER TABLE reviews ADD UNIQUE KEY unique_reader_book_type (reader_id, book_id, review_type)`,
  ];

  const runNext = (i) => {
    if (i >= migrations.length) {
      console.log("✅ Reviews table migration complete");
      connection.release();
      return;
    }
    connection.query(migrations[i], (e) => {
      // Ignore "Duplicate key name" and "Can't DROP" errors — migration already applied
      if (e && e.code !== "ER_DUP_KEYNAME" && e.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        console.warn(`⚠️  Migration step ${i + 1} warning:`, e.message);
      }
      runNext(i + 1);
    });
  };

  runNext(0);
});

module.exports = pool;
