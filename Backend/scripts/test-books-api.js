require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    }).on("error", reject);
  });
}

async function run() {
  console.log("Testing GET /api/books ...");
  const r = await get("/api/books");
  console.log("Status:", r.status);
  console.log("Success:", r.body.success);
  console.log("Books count:", r.body.books?.length);
  if (r.body.books?.length) {
    r.body.books.forEach(b => console.log(` - #${b.book_id} '${b.title}' by '${b.author_name}' status='${b.status}'`));
  } else {
    console.log("No books returned. Full response:", JSON.stringify(r.body));
  }
  process.exit(0);
}
run().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
