/**
 * Run this once to fix plain-text passwords for manually inserted authors.
 * Usage: node Backend/scripts/fix-author-passwords.js
 *
 * It will:
 * 1. Hash each author's password with bcrypt
 * 2. Update the authors table
 * 3. Mark them as verified (is_verified = 1) so they can log in
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const db = require("../src/config/db");

// Define the authors and the passwords you want them to use
const authors = [
  { email: "krisalareule@gmail.com",              password: "Author@123" },
  { email: "krishavreule@gmail.com",              password: "Author@123" },
  { email: "np03cs4s240056@heraldcollege.edu.np", password: "Author@123" },
];

async function run() {
  console.log("Fixing author passwords...\n");

  for (const author of authors) {
    const hash = await bcrypt.hash(author.password, 10);

    await new Promise((resolve, reject) => {
      db.query(
        `UPDATE authors
         SET password = ?, is_verified = 1, otp_code = NULL, otp_expiry = NULL
         WHERE email = ?`,
        [hash, author.email],
        (err, result) => {
          if (err) {
            console.error(`❌ Failed for ${author.email}:`, err.message);
            return reject(err);
          }
          if (result.affectedRows === 0) {
            console.warn(`⚠️  No author found with email: ${author.email}`);
          } else {
            console.log(`✅ Updated: ${author.email}  →  password: ${author.password}`);
          }
          resolve();
        }
      );
    });
  }

  console.log("\nDone. All authors can now log in with password: Author@123");
  process.exit(0);
}

run().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
