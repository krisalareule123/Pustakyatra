const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendWelcomeEmail } = require("../config/email");

const registerReader = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const checkEmailQuery = "SELECT * FROM readers WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists. Please sign in instead."
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = `
        INSERT INTO readers (full_name, email, password)
        VALUES (?, ?, ?)
      `;

      db.query(insertQuery, [fullName, email, hashedPassword], async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create account. Please try again"
          });
        }

        sendWelcomeEmail(email, fullName).catch((err) => {
          console.error("Email sending failed:", err.message);
        });

        const token = jwt.sign(
          { reader_id: result.insertId, email: email },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.status(201).json({
          success: true,
          message: "Account created successfully! Welcome to Pustakyatra.",
          token,
          user: {
            reader_id: result.insertId,
            fullName,
            email
          }
        });
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

const loginReader = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const query = "SELECT * FROM readers WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Account not found. Please create an account first."
        });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Incorrect password. Please try again."
        });
      }

      const token = jwt.sign(
        { reader_id: user.reader_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Login successful! Welcome back.",
        token,
        user: {
          reader_id: user.reader_id,
          fullName: user.full_name,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

const getReaderProfile = (req, res) => {
  try {
    const userId = req.user.reader_id;

    const query = `
      SELECT reader_id, full_name, email, created_at
      FROM readers
      WHERE reader_id = ?
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const user = results[0];

      res.status(200).json({
        success: true,
        user: {
          reader_id: user.reader_id,
          fullName: user.full_name,
          email: user.email,
          createdAt: user.created_at
        }
      });
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

module.exports = {
  registerReader,
  loginReader,
  getReaderProfile
};