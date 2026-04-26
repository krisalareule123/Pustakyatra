const express   = require("express");
const authAdmin = require("../middleware/authAdmin");
const {
  adminLogin, getAdminProfile, getDashboardStats, getRecentActivity,
  getAnalytics,
  getUsers, toggleUserStatus,
  getBooks, publishBook, hideBook,
  getPayments,
  getAuthors,
  getAdminReviews, updateReviewStatus, deleteAdminReview,
  getAdminNotifications, markAllAdminNotificationsRead, markAdminNotificationRead
} = require("../controllers/adminController");
const { getAdminPromoCodes, updatePromoCodeStatus } = require("../controllers/promoController");

const router = express.Router();

// Public
router.post("/login", adminLogin);

// Protected
router.get("/me",        authAdmin, getAdminProfile);
router.get("/stats",     authAdmin, getDashboardStats);
router.get("/recent",    authAdmin, getRecentActivity);
router.get("/analytics", authAdmin, getAnalytics);

// Users
router.get("/users",                authAdmin, getUsers);
router.patch("/users/:id/toggle",   authAdmin, toggleUserStatus);

// Authors
router.get("/authors",              authAdmin, getAuthors);

// Books
router.get("/books",                    authAdmin, getBooks);
router.patch("/books/:id/publish",      authAdmin, publishBook);
router.patch("/books/:id/hide",         authAdmin, hideBook);

// Payments
router.get("/payments",                 authAdmin, getPayments);
router.get("/test",      authAdmin, (req, res) => {
  res.json({ success: true, message: "Admin route working ✅", admin: req.admin });
});

// Notifications
router.get("/notifications",            authAdmin, getAdminNotifications);
router.patch("/notifications/read-all", authAdmin, markAllAdminNotificationsRead);
router.patch("/notifications/:id/read", authAdmin, markAdminNotificationRead);

// Reviews moderation
router.get("/reviews",                  authAdmin, getAdminReviews);
router.patch("/reviews/:id/status",     authAdmin, updateReviewStatus);
router.delete("/reviews/:id",           authAdmin, deleteAdminReview);

// Promo Codes
router.get("/promo-codes",                  authAdmin, getAdminPromoCodes);
router.patch("/promo-codes/:id/status",     authAdmin, updatePromoCodeStatus);

module.exports = router;
