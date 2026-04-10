const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const readerRoutes = require("./routes/reader.routes");
const reviewRoutes = require("./routes/review.routes");
const orderRoutes = require("./routes/order.routes");
const bookRoutes = require("./routes/book.routes");
const authorRoutes = require("./routes/author.routes");
const adminRoutes = require("./routes/admin.routes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded cover images publicly (covers are not sensitive)
app.use("/uploads/covers", express.static(path.join(__dirname, "../uploads/covers")));
app.use("/uploads/avatars", express.static(path.join(__dirname, "../uploads/avatars")));
// NOTE: PDFs are NOT served statically — they go through the protected /api/books/:id/read endpoint

app.use("/api/readers", readerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Pustakyatra API is running ✅",
    version: "1.0.0"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});