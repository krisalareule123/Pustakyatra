const express   = require("express");
const authAdmin = require("../middleware/authAdmin");
const {
  adminLogin, getAdminProfile, getDashboardStats, getRecentActivity,
  getAnalytics,
  getAdminNotifications, markAllAdminNotificationsRead, markAdminNotificationRead
} = require("../controllers/adminController");

const router = express.Router();

// Public
router.post("/login", adminLogin);

// Protected
router.get("/me",        authAdmin, getAdminProfile);
router.get("/stats",     authAdmin, getDashboardStats);
router.get("/recent",    authAdmin, getRecentActivity);
router.get("/analytics", authAdmin, getAnalytics);
router.get("/test",      authAdmin, (req, res) => {
  res.json({ success: true, message: "Admin route working ✅", admin: req.admin });
});

// Notifications
router.get("/notifications",            authAdmin, getAdminNotifications);
router.patch("/notifications/read-all", authAdmin, markAllAdminNotificationsRead);
router.patch("/notifications/:id/read", authAdmin, markAdminNotificationRead);

module.exports = router;
