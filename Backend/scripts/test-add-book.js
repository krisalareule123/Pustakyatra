/**
 * Quick smoke test: login as author, then call GET /api/authors/books
 * Run: node Backend/scripts/test-add-book.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "localhost", port: 5001, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => resolve(JSON.parse(raw)));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "localhost", port: 5001, path, method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => resolve(JSON.parse(raw)));
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("1. Logging in as krisalareule@gmail.com ...");
  const login = await post("/api/authors/login", { email: "krisalareule@gmail.com", password: "Author@123" });
  if (!login.success) { console.error("Login failed:", login.message); process.exit(1); }
  console.log("   ✅ Login OK — author_id:", login.author.author_id);

  console.log("2. Fetching /api/authors/books ...");
  const books = await get("/api/authors/books", login.token);
  if (!books.success) { console.error("Books fetch failed:", books.message); process.exit(1); }
  console.log("   ✅ Books OK — count:", books.books.length);
  books.books.forEach(b => console.log("     -", b.book_id, b.title, b.status));

  console.log("3. Fetching /api/authors/stats ...");
  const stats = await get("/api/authors/stats", login.token);
  console.log("   ✅ Stats:", stats.stats);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
