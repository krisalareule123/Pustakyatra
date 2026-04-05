require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const db = require("../src/config/db");
db.query("DESCRIBE admins", (err, rows) => {
  if (err) { console.error(err.message); process.exit(1); }
  console.log("admins columns:");
  rows.forEach(r => console.log(" ", r.Field, "|", r.Type, "| Default:", r.Default));
  db.query("SELECT admin_id, full_name, email, role, is_active FROM admins", (e, data) => {
    if (!e) { console.log("\nRows:"); data.forEach(r => console.log(" ", JSON.stringify(r))); }
    process.exit(0);
  });
});
