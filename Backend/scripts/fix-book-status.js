require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");

// Check current status values
db.query("SELECT book_id, title, status FROM books", (err, rows) => {
  if (err) { console.error(err.message); process.exit(1); }
  console.log("Current books:");
  rows.forEach(r => console.log(` #${r.book_id} '${r.title}' status='${r.status}'`));

  // Set all books to published
  db.query("UPDATE books SET status = 'published' WHERE status != 'published' OR status IS NULL", (err2, result) => {
    if (err2) { console.error(err2.message); process.exit(1); }
    console.log(`\n✅ Updated ${result.affectedRows} book(s) to published`);
    process.exit(0);
  });
});
