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

// ── cleanup-draft-orders ──────────────────────────────────────────────────────
async function cleanupDraftOrders() {
  const draftItems = await q(`
    SELECT oi.item_id, oi.order_id, oi.book_title, b.status AS book_status, o.status AS order_status
    FROM order_items oi
    JOIN books b ON b.book_id = oi.book_id
    JOIN orders o ON o.order_id = oi.order_id
    WHERE b.status = 'draft' OR b.status IS NULL
  `);

  if (draftItems.length === 0) {
    console.log("✅ No order_items linked to draft books. Nothing to clean.");
    return;
  }

  console.log(`Found ${draftItems.length} order_item(s) linked to draft books:`);
  draftItems.forEach(r =>
    console.log(`  item_id:${r.item_id} | order_id:${r.order_id} | book:${r.book_title} | book_status:${r.book_status} | order_status:${r.order_status}`)
  );

  const itemIds = draftItems.map(r => r.item_id);
  const del1 = await q(`DELETE FROM order_items WHERE item_id IN (${itemIds.join(",")})`);
  console.log(`\n🗑  Deleted ${del1.affectedRows} order_item(s) linked to draft books`);

  // Remove orders that are now empty
  const emptyOrders = await q(`
    SELECT o.order_id FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    WHERE oi.item_id IS NULL
  `);

  if (emptyOrders.length > 0) {
    const orderIds = emptyOrders.map(r => r.order_id);
    const del2 = await q(`DELETE FROM orders WHERE order_id IN (${orderIds.join(",")})`);
    console.log(`🗑  Deleted ${del2.affectedRows} empty order(s): [${orderIds.join(", ")}]`);
  } else {
    console.log("✅ No empty orders to remove.");
  }

  console.log("\n✅ Cleanup complete.");
}

// ── create-admin-notifications ────────────────────────────────────────────────
async function createAdminNotifications() {
  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        notification_id INT PRIMARY KEY AUTO_INCREMENT,
        type            VARCHAR(50) NOT NULL,
        message         VARCHAR(500) NOT NULL,
        related_id      INT NULL,
        is_read         TINYINT(1) NOT NULL DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  console.log("✅ admin_notifications table ready");
}

// ── create-notifications ─────────────────────────────────────────────────────
async function createNotifications() {
  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS author_notifications (
        notification_id INT PRIMARY KEY AUTO_INCREMENT,
        author_id       INT NOT NULL,
        reader_id       INT NULL,
        book_id         INT NULL,
        type            ENUM('purchase','rent','review','favorite') NOT NULL,
        message         VARCHAR(500) NOT NULL,
        is_read         TINYINT(1) NOT NULL DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  // Add reader_id column if it doesn't exist yet
  await new Promise((resolve) => {
    db.query("ALTER TABLE author_notifications ADD COLUMN reader_id INT NULL AFTER author_id", (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") console.error("reader_id column:", err.message);
      resolve();
    });
  });
  console.log("✅ author_notifications table ready");
}

// ── fix-admin-password ────────────────────────────────────────────────────────
async function fixAdminPassword() {
  const hash = await bcrypt.hash("Admin@2025", 10);
  const result = await q("UPDATE admins SET password = ? WHERE email = ?", [hash, "admin@pustakyatra.com"]);
  if (result.affectedRows === 0) console.warn("⚠️  No admin found with that email");
  else console.log("✅ Admin password hashed successfully");
}

// ── add-reader-status ─────────────────────────────────────────────────────────
async function addReaderStatus() {
  await q(`ALTER TABLE readers ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 0`);
  await q(`ALTER TABLE readers ADD COLUMN IF NOT EXISTS last_seen DATETIME NULL DEFAULT NULL`);
  await q(`ALTER TABLE readers ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) NOT NULL DEFAULT 0`);
  await q(`ALTER TABLE authors ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 0`);
  await q(`ALTER TABLE authors ADD COLUMN IF NOT EXISTS is_blocked TINYINT(1) NOT NULL DEFAULT 0`);
  await q(`ALTER TABLE authors ADD COLUMN IF NOT EXISTS last_seen DATETIME NULL DEFAULT NULL`);
  console.log("✅ is_active + last_seen + is_blocked added to readers; is_active + is_blocked added to authors");
}

// ── reset-user-status ─────────────────────────────────────────────────────────
async function resetUserStatus() {
  const result = await q("UPDATE readers SET is_active = 0");
  console.log(`✅ Reset ${result.affectedRows} readers to inactive`);
}

// ── create-promo-tables ───────────────────────────────────────────────────────
async function createPromoTables() {
  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        promo_code_id        INT PRIMARY KEY AUTO_INCREMENT,
        author_id            INT NOT NULL,
        code                 VARCHAR(50) NOT NULL,
        discount_type        ENUM('percentage','flat') NOT NULL,
        discount_value       DECIMAL(10,2) NOT NULL,
        promo_scope          ENUM('all_books','specific_book','rent_only') NOT NULL DEFAULT 'all_books',
        book_id              INT NULL,
        occasion             ENUM('new_launch','dashain','tihar','new_year','teej','first_reader','loyalty','review_reward','low_sales','custom') NOT NULL,
        expiry_date          DATE NOT NULL,
        usage_limit          INT NOT NULL DEFAULT 100,
        per_reader_limit     INT NOT NULL DEFAULT 1,
        minimum_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        usage_count          INT NOT NULL DEFAULT 0,
        status               ENUM('pending','active','disabled') NOT NULL DEFAULT 'pending',
        created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_code (code),
        FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
        FOREIGN KEY (book_id)   REFERENCES books(book_id)     ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  console.log("✅ promo_codes table ready");

  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS promo_code_usages (
        usage_id      INT PRIMARY KEY AUTO_INCREMENT,
        promo_code_id INT NOT NULL,
        reader_id     INT NOT NULL,
        order_id      INT NOT NULL,
        used_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (promo_code_id) REFERENCES promo_codes(promo_code_id) ON DELETE CASCADE,
        FOREIGN KEY (reader_id)     REFERENCES readers(reader_id)         ON DELETE CASCADE,
        FOREIGN KEY (order_id)      REFERENCES orders(order_id)           ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  console.log("✅ promo_code_usages table ready");

  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS reader_notifications (
        notification_id INT PRIMARY KEY AUTO_INCREMENT,
        reader_id       INT NOT NULL,
        type            VARCHAR(50) NOT NULL,
        message         VARCHAR(500) NOT NULL,
        related_id      INT NULL,
        is_read         TINYINT(1) NOT NULL DEFAULT 0,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  console.log("✅ reader_notifications table ready");

  for (const [col, sql] of [
    ["promo_code_id",    "ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code_id    INT NULL"],
    ["discount_amount",  "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount  DECIMAL(10,2) NULL DEFAULT 0"],
    ["discounted_total", "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discounted_total DECIMAL(10,2) NULL"],
  ]) {
    await new Promise(resolve => {
      db.query(sql, err => {
        if (err && err.code !== "ER_DUP_FIELDNAME") console.error(`  ❌ ${col}: ${err.message}`);
        else console.log(`  ✅ orders.${col} ready`);
        resolve();
      });
    });
  }

  await new Promise(resolve => {
    db.query(
      `ALTER TABLE orders ADD CONSTRAINT fk_orders_promo FOREIGN KEY (promo_code_id) REFERENCES promo_codes(promo_code_id) ON DELETE SET NULL`,
      err => { if (err && err.code !== "ER_DUP_KEYNAME" && err.code !== "ER_FK_DUP_NAME") console.error("FK:", err.message); resolve(); }
    );
  });

  console.log("\n✅ All promo tables ready. Restart your backend server.");
}
// ── add-soft-delete ───────────────────────────────────────────────────────────
async function addSoftDelete() {
  await q(`ALTER TABLE books ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL`);
  console.log("✅ books.deleted_at column ready");
}

// ── create-reading-progress ───────────────────────────────────────────────────
async function createReadingProgress() {
  await new Promise((resolve, reject) => {
    db.query(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        progress_id INT PRIMARY KEY AUTO_INCREMENT,
        reader_id   INT NOT NULL,
        book_id     INT NOT NULL,
        page_number INT NOT NULL DEFAULT 1,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_reader_book (reader_id, book_id),
        FOREIGN KEY (reader_id) REFERENCES readers(reader_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => err ? reject(err) : resolve());
  });
  console.log("✅ reading_progress table ready");
}

const commands = { inspect, describe, migrate, "clean-books": cleanBooks,
                   "fix-book-status": fixBookStatus, "fix-passwords": fixPasswords,
                   "cleanup-draft-orders": cleanupDraftOrders,
                   "create-notifications": createNotifications,
                   "create-admin-notifications": createAdminNotifications,
                   "fix-admin-password": fixAdminPassword,
                   "add-reader-status": addReaderStatus,
                   "reset-user-status": resetUserStatus,
                   "create-promo-tables": createPromoTables,
                   "add-soft-delete": addSoftDelete,
                   "create-reading-progress": createReadingProgress };

if (!cmd || !commands[cmd]) {
  console.log("Usage: node Backend/scripts/db-tools.js <command>\n");
  console.log("Commands:", Object.keys(commands).join(", "));
  process.exit(0);
}

commands[cmd]().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
