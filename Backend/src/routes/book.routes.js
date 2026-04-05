const express = require("express");
const jwt = require("jsonwebtoken");
const { createBook, updateBook, updateBookPdf, publishBook, getBooks, getBook, servePdf, downloadPdf } = require("../controllers/bookController");
const authReader = require("../middleware/authReader");
const { uploadBook } = require("../config/upload");

const router = express.Router();

// Author auth middleware (same logic as in author.routes.js)
const authAuthor = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Access denied. Please login." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.author_id) return res.status(401).json({ success: false, message: "Invalid author token." });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const withUpload = (req, res, next) => {
  uploadBook(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

// Public
router.get("/", getBooks);
router.get("/:bookId", getBook);

// Author-protected (uses author JWT)
router.post("/", authAuthor, withUpload, createBook);
router.put("/:bookId/update", authAuthor, withUpload, updateBook);
router.put("/:bookId/pdf", authAuthor, withUpload, updateBookPdf);
router.put("/:bookId/publish", authAuthor, publishBook);

// Reader-protected
router.get("/:bookId/read", authReader, servePdf);
router.get("/:bookId/download", authReader, downloadPdf);

module.exports = router;
