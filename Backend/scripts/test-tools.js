/**
 * API test scripts for Pustakyatra.
 *
 * Usage:
 *   node Backend/scripts/test-tools.js <command>
 *
 * Commands:
 *   books-api    — Test GET /api/books and print results
 *   author-login — Login as author and fetch their books + stats
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");

const cmd = process.argv[2];

function get(path, token) {
  return new Promise((resolve, reject) => {
    const opts = { host: "localhost", port: 5001, path, method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {} };
    http.request(opts, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    }).on("error", reject).end();
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "localhost", port: 5001, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, res => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => resolve(JSON.parse(raw)));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── books-api ─────────────────────────────────────────────────────────────────
async function testBooksApi() {
  console.log("Testing GET /api/books ...");
  const r = await get("/api/books");
  console.log("Status:", r.status, "| Success:", r.body.success, "| Count:", r.body.books?.length ?? 0);
  if (r.body.books?.length) {
    r.body.books.forEach(b => console.log(` - #${b.book_id} '${b.title}' by '${b.author_name}' status='${b.status}'`));
  } else {
    console.log("No books returned:", JSON.stringify(r.body));
  }
}

// ── author-login ──────────────────────────────────────────────────────────────
async function testAuthorLogin() {
  console.log("1. Logging in as krisalareule@gmail.com ...");
  const login = await post("/api/authors/login", { email: "krisalareule@gmail.com", password: "Author@123" });
  if (!login.success) { console.error("Login failed:", login.message); return; }
  console.log("   ✅ Login OK — author_id:", login.author.author_id);

  console.log("2. Fetching /api/authors/books ...");
  const books = await get("/api/authors/books", login.token);
  if (!books.success) { console.error("Books fetch failed:", books.message); return; }
  console.log("   ✅ Books OK — count:", books.books.length);
  books.books.forEach(b => console.log("     -", b.book_id, b.title, b.status));

  console.log("3. Fetching /api/authors/stats ...");
  const stats = await get("/api/authors/stats", login.token);
  console.log("   ✅ Stats:", stats.stats);
}

// ── router ────────────────────────────────────────────────────────────────────
const commands = { "books-api": testBooksApi, "author-login": testAuthorLogin };

if (!cmd || !commands[cmd]) {
  console.log("Usage: node Backend/scripts/test-tools.js <command>\n");
  console.log("Commands:", Object.keys(commands).join(", "));
  process.exit(0);
}

commands[cmd]().then(() => process.exit(0)).catch(e => { console.error("FAILED:", e.message); process.exit(1); });
