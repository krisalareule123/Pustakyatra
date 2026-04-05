const jwt = require("jsonwebtoken");

const authAdmin = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. Admin login required." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.admin_id) {
      return res.status(401).json({ success: false, message: "Invalid admin token." });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    const msg = error.name === "TokenExpiredError"
      ? "Admin session expired. Please log in again."
      : "Invalid token. Please log in again.";
    res.status(401).json({ success: false, message: msg });
  }
};

module.exports = authAdmin;
