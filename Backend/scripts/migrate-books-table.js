/**
 * Adds missing columns to the books table.
 * Run: node Backend/scripts/migrate-books-table.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");

const steps = [
  ["author_id",    "ALTER TABLE books ADD COLUMN author_id INT NULL AFTER book_id"],
  ["nepali_title", "ALTER TABLE books ADD COLUMN nepali_title VARCHAR(255) NULL AFTER title"],
  ["description",  "ALTER TABLE books ADD COLUMN description TEXT NULL AFTER nepali_title"],
  ["category",     "ALTER TABLE books ADD COLUMN category VARCHAR(100) NULL AFTER description"],
  ["language",     "ALTER TABLE books ADD COLUMN language VARCHAR(50) DEFAULT 'Nepali' AFTER category"],
  ["keywords",     "ALTER TABLE books ADD COLUMN keywords VARCHAR(500) NULL AFTER language"],
  ["buy_price",    "ALTER TABLE books ADD COLUMN buy_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER keywords"],
  ["rent_price",   "ALTER TABLE books ADD COLUMN rent_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER buy_price"],
  ["rent_days",    "ALTER TABLE books ADD COLUMN rent_days INT NOT NULL DEFAULT 15 AFTER rent_price"],
  ["status",       "ALTER TABLE books ADD COLUMN status ENUM('draft','published') DEFAULT 'published' AFTER rent_days"],
  ["updated_at",   "ALTER TABLE books ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"],
];

async function run() {
  for (const [col, sql] of steps) {
    await new Promise((resolve) => {
      db.query(sql, (err) => {
        if (err && err.code === "ER_DUP_FIELDNAME") {
          console.log(`  ⏭  ${col} already exists — skipped`);
        } else if (err) {
          console.error(`  ❌ ${col}: ${err.message}`);
        } else {
          console.log(`  ✅ Added: ${col}`);
        }
        resolve();
      });
    });
  }

  // Add indexes (ignore if already exist)
  const indexes = [
    "CREATE INDEX idx_books_author_id ON books(author_id)",
    "CREATE INDEX idx_books_status ON books(status)",
  ];
  for (const sql of indexes) {
    await new Promise((resolve) => {
      db.query(sql, (err) => {
        if (err && (err.code === "ER_DUP_KEYNAME" || err.code === "ER_DUP_ENTRY")) {
          // index already exists — fine
        } else if (err) {
          // non-fatal
        }
        resolve();
      });
    });
  }

  console.log("\n✅ Migration complete.");
  process.exit(0);
}

run();
