require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");
db.query("DESCRIBE books", (err, rows) => {
  if (err) { console.error(err.message); process.exit(1); }
  console.log("books table columns:");
  rows.forEach(r => console.log(" ", r.Field, "|", r.Type, "| NULL:", r.Null, "| Default:", r.Default));
  process.exit(0);
});
