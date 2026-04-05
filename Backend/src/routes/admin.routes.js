const express   = require("express");
const authAdmin = require("../middleware/authAdmin");
const { adminLogin, getAdminProfile, getDashboardStats, getRecentActivity } = require("../controllers/adminController");

const router = express.Router();

// Public
router.post("/login", adminLogin);

// Protected
router.get("/me",     authAdmin, getAdminProfile);
router.get("/stats",  authAdmin, getDashboardStats);
router.get("/recent", authAdmin, getRecentActivity);
router.get("/test",   authAdmin, (req, res) => {
  res.json({ success: true, message: "Admin route working ✅", admin: req.admin });
});

module.exports = router;
