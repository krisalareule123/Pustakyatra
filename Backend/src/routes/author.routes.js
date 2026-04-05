const express = require("express");
const jwt = require("jsonwebtoken");
const {
  registerAuthor, verifyAuthorEmail, resendAuthorOTP,
  loginAuthor, getAuthorProfile, updateAuthorProfile, changeAuthorPassword,
  getAuthorStats, getAuthorBook, getAuthorBooks,
  getAuthorReviews, getNotifications, markNotificationRead, getPublicAuthors, getAuthorPublicBooks
} = require("../controllers/authorController");

const router = express.Router();

// Auth middleware for authors
const authAuthor = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Access denied. Please login." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.author_id) return res.status(401).json({ success: false, message: "Invalid author token." });
    req.user = decoded;
    next();
  } catch (error) {
    const msg = error.name === "TokenExpiredError"
      ? "Session expired. Please login again."
      : "Invalid token. Please login again.";
    res.status(401).json({ success: false, message: msg });
  }
};

// Public routes (no auth needed)
router.get("/public", getPublicAuthors);
router.get("/:authorId/books", getAuthorPublicBooks);
router.post("/register", registerAuthor);
router.post("/verify-email", verifyAuthorEmail);
router.post("/resend-otp", resendAuthorOTP);
router.post("/login", loginAuthor);

// Protected
router.get("/me", authAuthor, getAuthorProfile);
router.put("/me", authAuthor, updateAuthorProfile);
router.put("/change-password", authAuthor, changeAuthorPassword);
router.get("/stats", authAuthor, getAuthorStats);
router.get("/books", authAuthor, getAuthorBooks);
router.get("/books/:bookId", authAuthor, getAuthorBook);
router.get("/reviews", authAuthor, getAuthorReviews);
router.get("/notifications", authAuthor, getNotifications);
router.patch("/notifications/:id/read", authAuthor, markNotificationRead);

module.exports = router;
