/**
 * Database utility scripts for Pustakyatra.
 *
 * Usage:
 *   node Backend/scripts/db-tools.js <command>
 *
 * Commands:
 *   inspect          — Show all authors and books in the database
 *   describe         — Show books table column structure
 *   migrate          — Add missing columns to the books table
 *   clean-books      — Remove orphaned books and fix author links
 *   fix-book-status  — Set all books to 'published' status
 *   fix-passwords    — Hash plain-text author passwords with bcrypt
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db  = require("../src/config/db");
const bcrypt = require("bcryptjs");

const cmd = process.argv[2];

function q(sql, params = []) {
  return new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));
}

// ── inspect ──────────────────────────────────────────────────────────────────
async function inspect() {
  console.log("\n=== AUTHORS ===");
  const authors = await q("SELECT author_id, full_name, email, is_verified FROM authors");
  authors.forEach(a => console.log(` #${a.author_id} | ${a.full_name} | ${a.email} | verified:${a.is_verified}`));

  console.log("\n=== BOOKS ===");
  const books = await q("SELECT book_id, author_id, title, author, status FROM books");
  books.forEach(b => console.log(` #${b.book_id} | author_id:${b.author_id} | author_col:'${b.author}' | '${b.title}' | ${b.status}`));
}

// ── describe ─────────────────────────────────────────────────────────────────
async function describe() {
  const rows = await q("DESCRIBE books");
  console.log("books table columns:");
  rows.forEach(r => console.log(" ", r.Field, "|", r.Type, "| NULL:", r.Null, "| Default:", r.Default));
}

// ── migrate ──────────────────────────────────────────────────────────────────
async function migrate() {
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

  for (const [col, sql] of steps) {
    await new Promise(resolve => {
      db.query(sql, err => {
        if (err && err.code === "ER_DUP_FIELDNAME") console.log(`  ⏭  ${col} already exists`);
        else if (err) console.error(`  ❌ ${col}: ${err.message}`);
        else console.log(`  ✅ Added: ${col}`);
        resolve();
      });
    });
  }

  for (const sql of [
    "CREATE INDEX idx_books_author_id ON books(author_id)",
    "CREATE INDEX idx_books_status ON books(status)",
  ]) {
    await new Promise(resolve => { db.query(sql, () => resolve()); });
  }

  console.log("\n✅ Migration complete.");
}

// ── clean-books ───────────────────────────────────────────────────────────────
async function cleanBooks() {
  console.log("=== Books before cleanup ===");
  const before = await q("SELECT book_id, author_id, title, status FROM books");
  before.forEach(b => console.log(` #${b.book_id} | author_id:${b.author_id} | '${b.title}' | ${b.status}`));

  const del = await q("DELETE FROM books WHERE author_id IS NULL");
  console.log(del.affectedRows > 0
    ? `\n🗑  Removed ${del.affectedRows} orphaned book(s)`
    : "\n✅ No orphaned books to remove");

  const sl = await q("SELECT book_id, author_id, title FROM books WHERE title LIKE '%Summer Love%'");
  for (const b of sl) {
    if (b.author_id !== 6) {
      await q("UPDATE books SET author_id = 6 WHERE book_id = ?", [b.book_id]);
      console.log(`🔧 Fixed Summer Love → author_id=6`);
    } else {
      console.log(`✅ Summer Love already linked to author_id=6`);
    }
  }

  console.log("\n=== Books after cleanup ===");
  const after = await q(`
    SELECT b.book_id, b.author_id, b.title, b.status, a.full_name AS author_name
    FROM books b LEFT JOIN authors a ON a.author_id = b.author_id
  `);
  after.forEach(b => console.log(` #${b.book_id} | '${b.title}' | by ${b.author_name} | ${b.status}`));
}

// ── fix-book-status ───────────────────────────────────────────────────────────
async function fixBookStatus() {
  const rows = await q("SELECT book_id, title, status FROM books");
  console.log("Current books:");
  rows.forEach(r => console.log(` #${r.book_id} '${r.title}' status='${r.status}'`));

  const result = await q("UPDATE books SET status = 'published' WHERE status != 'published' OR status IS NULL");
  console.log(`\n✅ Updated ${result.affectedRows} book(s) to published`);
}

// ── fix-passwords ─────────────────────────────────────────────────────────────
async function fixPasswords() {
  const authors = [
    { email: "krisalareule@gmail.com",              password: "Author@123" },
    { email: "krishavreule@gmail.com",              password: "Author@123" },
    { email: "np03cs4s240056@heraldcollege.edu.np", password: "Author@123" },
  ];

  console.log("Fixing author passwords...\n");
  for (const author of authors) {
    const hash = await bcrypt.hash(author.password, 10);
    const result = await q(
      "UPDATE authors SET password = ?, is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE email = ?",
      [hash, author.email]
    );
    if (result.affectedRows === 0) console.warn(`⚠️  Not found: ${author.email}`);
    else console.log(`✅ Updated: ${author.email} → password: ${author.password}`);
  }
  console.log("\nDone. All authors can log in with: Author@123");
}

// ── router ────────────────────────────────────────────────────────────────────
const commands = { inspect, describe, migrate, "clean-books": cleanBooks,
                   "fix-book-status": fixBookStatus, "fix-passwords": fixPasswords };

if (!cmd || !commands[cmd]) {
  console.log("Usage: node Backend/scripts/db-tools.js <command>\n");
  console.log("Commands:", Object.keys(commands).join(", "));
  process.exit(0);
}

commands[cmd]().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
