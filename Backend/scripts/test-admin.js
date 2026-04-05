require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "localhost", port: 5001, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, res => { let r = ""; res.on("data", c => r += c); res.on("end", () => resolve(JSON.parse(r))); });
    req.on("error", reject);
    req.write(data); req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    http.request({ host: "localhost", port: 5001, path, method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    }, res => { let r = ""; res.on("data", c => r += c); res.on("end", () => resolve(JSON.parse(r))); })
    .on("error", reject).end();
  });
}

async function run() {
  console.log("1. Admin login...");
  const login = await post("/api/admin/login", { email: "admin@pustakyatra.com", password: "Admin@2025" });
  if (!login.success) { console.error("❌ Login failed:", login.message); process.exit(1); }
  console.log("   ✅ Login OK — admin_id:", login.admin.admin_id, "| role:", login.admin.role);

  const token = login.token;

  console.log("2. Test protected route...");
  const test = await get("/api/admin/test", token);
  console.log("   ✅ Test route:", test.message);

  console.log("3. Dashboard stats...");
  const stats = await get("/api/admin/stats", token);
  if (!stats.success) { console.error("❌ Stats failed:", stats.message); process.exit(1); }
  console.log("   ✅ Stats:", JSON.stringify(stats.stats));

  process.exit(0);
}

run().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
