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

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.log("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ MySQL Connected to", process.env.DB_NAME);
    connection.release();
  }
});

module.exports = pool;
