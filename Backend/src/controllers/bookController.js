const db = require("../config/db");
const path = require("path");
const fs = require("fs");

// Create / upload a new book (author only — author_id from JWT)
const createBook = (req, res) => {
  try {
    const authorId = req.user.author_id; // from authAuthor middleware

    const {
      title, nepaliTitle, description, category,
      language, keywords, buyPrice, rentPrice, rentDays, status
    } = req.body;

    if (!title || !buyPrice || !rentPrice) {
      return res.status(400).json({ success: false, message: "title, buyPrice and rentPrice are required" });
    }

    const bookStatus = status === "draft" ? "draft" : "published";

    const coverImage = req.files?.coverImage?.[0]?.filename
      ? `uploads/covers/${req.files.coverImage[0].filename}`
      : null;

    const pdfFile = req.files?.bookFile?.[0]?.filename
      ? `uploads/pdfs/${req.files.bookFile[0].filename}`
      : null;

    const query = `
      INSERT INTO books
        (author_id, title, nepali_title, description, category, language,
         keywords, buy_price, rent_price, rent_days, cover_image, pdf_file, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      authorId, title, nepaliTitle || null, description || null,
      category || null, language || "Nepali", keywords || null,
      parseFloat(buyPrice), parseFloat(rentPrice), parseInt(rentDays) || 15,
      coverImage, pdfFile, bookStatus
    ], (err, result) => {
      if (err) {
        console.error("DB error creating book:", err.message);
        return res.status(500).json({ success: false, message: "Failed to save book: " + err.message });
      }

      res.status(201).json({
        success: true,
        message: bookStatus === "draft" ? "Book saved as draft" : "Book published successfully",
        bookId: result.insertId,
        status: bookStatus,
        pdfFile,
        coverImage
      });
    });
  } catch (error) {
    console.error("createBook error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update PDF for an existing book (author only — uses JWT)
const updateBookPdf = (req, res) => {
  try {
    const { bookId } = req.params;
    const authorId = req.user.author_id;

    if (!req.files?.bookFile?.[0]) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const pdfFile = `uploads/pdfs/${req.files.bookFile[0].filename}`;

    // Delete old PDF if exists
    db.query("SELECT pdf_file FROM books WHERE book_id = ? AND author_id = ?", [bookId, authorId], (err, rows) => {
      if (err || !rows.length) {
        return res.status(404).json({ success: false, message: "Book not found" });
      }

      const oldPdf = rows[0].pdf_file;
      if (oldPdf) {
        const oldPath = path.join(__dirname, "../../", oldPdf);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      db.query(
        "UPDATE books SET pdf_file = ? WHERE book_id = ? AND author_id = ?",
        [pdfFile, bookId, authorId],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, message: "Failed to update PDF" });
          res.status(200).json({ success: true, message: "PDF updated", pdfFile });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all published books (public) — includes real author name via JOIN
const getBooks = (req, res) => {
  try {
    const { category, language, search } = req.query;
    let where = "WHERE (b.status = 'published' OR b.status IS NULL)";
    const params = [];

    if (category) { where += " AND b.category = ?"; params.push(category); }
    if (language) { where += " AND b.language = ?"; params.push(language); }
    if (search) {
      where += " AND (b.title LIKE ? OR b.nepali_title LIKE ? OR b.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    db.query(
      `SELECT b.book_id, b.author_id, b.title, b.nepali_title, b.description,
              b.category, b.language, b.buy_price, b.rent_price, b.rent_days,
              b.cover_image, b.status, b.created_at,
              COALESCE(a.full_name, b.author) AS author_name
       FROM books b
       LEFT JOIN authors a ON a.author_id = b.author_id
       ${where} ORDER BY b.created_at DESC`,
      params,
      (err, results) => {
        if (err) {
          console.error("DB error fetching books:", err.message);
          return res.status(500).json({ success: false, message: "Server error" });
        }
        res.status(200).json({ success: true, books: results });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single book by ID (public) — includes real author name
const getBook = (req, res) => {
  try {
    const { bookId } = req.params;
    db.query(
      `SELECT b.book_id, b.author_id, b.title, b.nepali_title, b.description,
              b.category, b.language, b.keywords, b.buy_price, b.rent_price,
              b.rent_days, b.cover_image, b.status, b.created_at,
              COALESCE(a.full_name, b.author) AS author_name
       FROM books b
       LEFT JOIN authors a ON a.author_id = b.author_id
       WHERE b.book_id = ? AND (b.status = 'published' OR b.status IS NULL)`,
      [bookId],
      (err, results) => {
        if (err || !results.length) {
          return res.status(404).json({ success: false, message: "Book not found" });
        }
        res.status(200).json({ success: true, book: results[0] });
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Serve PDF — protected, only for readers with valid access
// Called by the Reader page after token is resolved
const servePdf = (req, res) => {
  try {
    const { bookId } = req.params;
    const readerId = req.user.reader_id;

    // Verify access
    const accessQuery = `
      SELECT oi.book_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ? AND oi.book_id = ? AND o.status = 'paid'
        AND (oi.item_type = 'buy' OR (oi.item_type = 'rent' AND oi.access_expires_at > NOW()))
      LIMIT 1
    `;

    db.query(accessQuery, [readerId, bookId], (err, rows) => {
      if (err || !rows.length) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      // Fetch pdf_file path
      db.query("SELECT pdf_file FROM books WHERE book_id = ?", [bookId], (err2, bookRows) => {
        if (err2 || !bookRows.length || !bookRows[0].pdf_file) {
          return res.status(404).json({ success: false, message: "PDF not available for this book" });
        }

        const pdfPath = path.join(__dirname, "../../", bookRows[0].pdf_file);

        if (!fs.existsSync(pdfPath)) {
          return res.status(404).json({ success: false, message: "PDF file not found on server" });
        }

        // Stream the PDF — inline so browser renders it, not downloads
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "private, no-store"); // don't cache protected content
        fs.createReadStream(pdfPath).pipe(res);
      });
    });
  } catch (error) {
    console.error("servePdf error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Download PDF — only for bought books
const downloadPdf = (req, res) => {
  try {
    const { bookId } = req.params;
    const readerId = req.user.reader_id;

    // Only buy access allows download
    const accessQuery = `
      SELECT oi.book_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.reader_id = ? AND oi.book_id = ? AND o.status = 'paid'
        AND oi.item_type = 'buy'
      LIMIT 1
    `;

    db.query(accessQuery, [readerId, bookId], (err, rows) => {
      if (err || !rows.length) {
        return res.status(403).json({ success: false, message: "Download not allowed. Purchase the book for permanent download access." });
      }

      db.query("SELECT pdf_file, title FROM books WHERE book_id = ?", [bookId], (err2, bookRows) => {
        if (err2 || !bookRows.length || !bookRows[0].pdf_file) {
          return res.status(404).json({ success: false, message: "PDF not available" });
        }

        const pdfPath = path.join(__dirname, "../../", bookRows[0].pdf_file);
        if (!fs.existsSync(pdfPath)) {
          return res.status(404).json({ success: false, message: "PDF file not found" });
        }

        const safeTitle = bookRows[0].title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
        res.setHeader("Cache-Control", "private, no-store");
        fs.createReadStream(pdfPath).pipe(res);
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { createBook, updateBookPdf, getBooks, getBook, servePdf, downloadPdf };

// Helper: create a notification for an author (called from other controllers)
function createAuthorNotification(authorId, bookId, type, message) {
  db.query(
    "INSERT INTO author_notifications (author_id, book_id, type, message) VALUES (?, ?, ?, ?)",
    [authorId, bookId || null, type, message],
    (err) => { if (err) console.error("Notification insert error:", err.message); }
  );
}

module.exports = { createBook, updateBookPdf, getBooks, getBook, servePdf, downloadPdf, createAuthorNotification };
