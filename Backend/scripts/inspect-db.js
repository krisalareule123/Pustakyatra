require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");

async function q(sql) {
  return new Promise((res, rej) => db.query(sql, (e, r) => e ? rej(e) : res(r)));
}

async function run() {
  console.log("\n=== AUTHORS ===");
  const authors = await q("SELECT author_id, full_name, email, is_verified FROM authors");
  authors.forEach(a => console.log(` #${a.author_id} | ${a.full_name} | ${a.email} | verified:${a.is_verified}`));

  console.log("\n=== BOOKS ===");
  const books = await q("SELECT book_id, author_id, title, author, status FROM books");
  books.forEach(b => console.log(` #${b.book_id} | author_id:${b.author_id} | author_col:'${b.author}' | '${b.title}' | ${b.status}`));

  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
