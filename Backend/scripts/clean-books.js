/**
 * Cleans up the books table:
 * - Removes books with no author_id (orphaned/demo rows)
 * - Verifies Summer Love is linked to Subin Bhattarai (author_id=6)
 * Run: node Backend/scripts/clean-books.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");

async function q(sql, params = []) {
  return new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));
}

async function run() {
  console.log("=== Books before cleanup ===");
  const before = await q("SELECT book_id, author_id, title, status FROM books");
  before.forEach(b => console.log(` #${b.book_id} | author_id:${b.author_id} | '${b.title}' | ${b.status}`));

  // Remove books with no author_id (orphaned demo data)
  const del = await q("DELETE FROM books WHERE author_id IS NULL");
  if (del.affectedRows > 0) console.log(`\n🗑  Removed ${del.affectedRows} orphaned book(s) with no author_id`);
  else console.log("\n✅ No orphaned books to remove");

  // Verify Summer Love is owned by Subin Bhattarai (author_id=6)
  const sl = await q("SELECT book_id, author_id, title FROM books WHERE title LIKE '%Summer Love%'");
  if (sl.length > 0) {
    for (const b of sl) {
      if (b.author_id !== 6) {
        await q("UPDATE books SET author_id = 6 WHERE book_id = ?", [b.book_id]);
        console.log(`\n🔧 Fixed Summer Love (book_id=${b.book_id}) → author_id set to 6 (Subin Bhattarai)`);
      } else {
        console.log(`\n✅ Summer Love (book_id=${b.book_id}) already correctly linked to author_id=6`);
      }
    }
  }

  console.log("\n=== Books after cleanup ===");
  const after = await q(`
    SELECT b.book_id, b.author_id, b.title, b.status, a.full_name AS author_name
    FROM books b LEFT JOIN authors a ON a.author_id = b.author_id
  `);
  after.forEach(b => console.log(` #${b.book_id} | '${b.title}' | by ${b.author_name} | ${b.status}`));

  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
