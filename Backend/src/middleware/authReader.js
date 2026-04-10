const jwt = require("jsonwebtoken");
const db  = require("../config/db");

const authReader = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login to continue."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Always update last_seen — skip on logout (logout sets it to NULL)
    if (req.path !== "/logout") {
      db.query(
        "UPDATE readers SET last_seen = NOW() WHERE reader_id = ?",
        [decoded.reader_id],
        (err) => {
          if (err) console.error("last_seen update error:", err.message);
        }
      );
    } else {
      console.log("⚡ Logout middleware hit for reader:", decoded.reader_id);
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again."
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again."
    });
  }
};

module.exports = authReader;