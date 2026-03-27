const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail, sendLoginOTPEmail } = require("../config/email");

const registerReader = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Full name validation: letters only, at least 2 words, each word ≥ 2 chars
    const trimmedName = fullName.trim();
    if (/[^a-zA-Z\s]/.test(trimmedName)) {
      return res.status(400).json({ success: false, message: "Full name should only contain letters." });
    }
    const nameParts = trimmedName.split(/\s+/).filter(Boolean);
    if (nameParts.length < 2) {
      return res.status(400).json({ success: false, message: "Please enter your full name (first and last name)." });
    }
    if (nameParts.some(w => w.length < 2)) {
      return res.status(400).json({ success: false, message: "Each part of your name must be at least 2 letters." });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    // Password validation: min 8 chars, uppercase, lowercase, number, special char
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must include at least one uppercase letter." });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must include at least one lowercase letter." });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must include at least one number." });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ success: false, message: "Password must include at least one special character (e.g. @, #, !)." });
    }

    const checkEmailQuery = "SELECT * FROM readers WHERE email = ?";
    db.query(checkEmailQuery, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (results.length > 0) {
        return res.status(400).json({ success: false, message: "An account with this email already exists. Please sign in instead." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const insertQuery = `
        INSERT INTO readers (full_name, email, password, otp_code, otp_expiry, is_verified)
        VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0)
      `;

      db.query(insertQuery, [trimmedName, email, hashedPassword, otp], async (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ success: false, message: "Failed to create account. Please try again" });
        }

        console.log("✅ Reader registered. Sending verification OTP to:", email);

        // Send OTP email (non-blocking)
        sendOTPEmail(email, fullName, otp).catch((e) =>
          console.error("Email sending failed:", e.message)
        );

        res.status(201).json({
          success: true,
          requiresOTP: true,
          message: "Account created! Please verify your email to continue.",
          email: email
        });
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

// Verify registration OTP and issue JWT
const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Please provide email and OTP" });
    }

    const query = `
      SELECT * FROM readers
      WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()
    `;

    db.query(query, [email, otp], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Server error. Please try again later" });
      }

      if (results.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please try again." });
      }

      const user = results[0];

      // Mark as verified and clear OTP
      db.query(
        "UPDATE readers SET is_verified = 1, otp_code = NULL, otp_expiry = NULL WHERE email = ?",
        [email]
      );

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, user.full_name).catch((e) =>
        console.error("Welcome email failed:", e.message)
      );

      // Issue JWT
      const token = jwt.sign(
        { reader_id: user.reader_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Email verified! Welcome to Pustakyatra.",
        token,
        user: {
          reader_id: user.reader_id,
          fullName: user.full_name,
          email: user.email
        }
      });
    });
  } catch (error) {
    console.error("Verify register OTP error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later" });
  }
};

const loginReader = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

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

      // ✅ Credentials valid — generate OTP, do NOT issue JWT yet
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log("✅ Credentials valid. Generating login OTP for:", email);

      const updateQuery = `
        UPDATE readers
        SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        WHERE email = ?
      `;

      db.query(updateQuery, [otp, email], async (err) => {
        if (err) {
          console.error("Database error saving OTP:", err);
          return res.status(500).json({
            success: false,
            message: "Server error. Please try again later"
          });
        }

        console.log("✅ OTP saved to DB. Sending email...");

        // Send login OTP email
        const emailResult = await sendLoginOTPEmail(email, user.full_name, otp);

        if (!emailResult.success) {
          console.error("❌ Failed to send OTP email:", emailResult.error);
          // Still return requiresOTP so user can proceed (dev fallback)
          // In production you may want to block here
        }

        console.log("✅ Login OTP flow complete. Returning requiresOTP: true");

        // ✅ Return OTP required — no token here
        res.status(200).json({
          success: true,
          requiresOTP: true,
          message: emailResult.success
            ? "OTP sent to your email. Please verify to complete login."
            : "OTP generated. Check your email (or server logs for dev).",
          email: email
        });
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

// Verify Login OTP and issue JWT
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP"
      });
    }

    const query = `
      SELECT * FROM readers
      WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()
    `;

    db.query(query, [email, otp], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP. Please try again."
        });
      }

      const user = results[0];

      // Clear OTP after successful verification
      db.query(
        "UPDATE readers SET otp_code = NULL, otp_expiry = NULL WHERE email = ?",
        [email]
      );

      // Generate JWT token
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
    console.error("Verify login OTP error:", error);
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
      SELECT reader_id, full_name, email, phone, address, is_verified, created_at
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
          phone: user.phone,
          address: user.address,
          emailVerified: user.is_verified,
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

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.reader_id;
    const { fullName, email, phone, address } = req.body;

    console.log("Update Profile Request:", { fullName, email, phone, address, userId });

    // Trim values
    const trimmedFullName = fullName?.trim();
    const trimmedEmail = email?.trim();

    if (!trimmedFullName || !trimmedEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide full name and email"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate phone if provided
    if (phone && phone.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid phone number"
        });
      }
    }

    // Check if email is already taken by another user
    const checkEmailQuery = "SELECT * FROM readers WHERE email = ? AND reader_id != ?";
    db.query(checkEmailQuery, [trimmedEmail, userId], (err, results) => {
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
          message: "This email is already in use by another account"
        });
      }

      const updateQuery = `
        UPDATE readers
        SET full_name = ?, email = ?, phone = ?, address = ?
        WHERE reader_id = ?
      `;

      const phoneValue = phone && phone.trim() !== '' ? phone : null;
      const addressValue = address && address.trim() !== '' ? address : null;

      db.query(updateQuery, [trimmedFullName, trimmedEmail, phoneValue, addressValue, userId], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update profile. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          user: {
            reader_id: userId,
            fullName: trimmedFullName,
            email: trimmedEmail,
            phone: phoneValue,
            address: addressValue
          }
        });
      });
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.reader_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password" });
    }

    // Strong password validation
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must include at least one uppercase letter." });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must include at least one lowercase letter." });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must include at least one number." });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must include at least one special character (e.g. @, #, !)." });
    }

    const query = "SELECT * FROM readers WHERE reader_id = ?";
    db.query(query, [userId], async (err, results) => {
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
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateQuery = "UPDATE readers SET password = ? WHERE reader_id = ?";
      db.query(updateQuery, [hashedPassword, userId], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to change password. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "Password changed successfully"
        });
      });
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email address"
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
          message: "No account found with this email address"
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log("Forgot Password - Generating OTP:");
      console.log("Email:", email);
      console.log("OTP:", otp);

      // Use MySQL's DATE_ADD to avoid timezone issues
      const updateQuery = `
        UPDATE readers
        SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        WHERE email = ?
      `;

      db.query(updateQuery, [otp, email], async (err, result) => {
        if (err) {
          console.error("Database error in forgotPassword:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to generate OTP. Please try again"
          });
        }

        console.log("OTP saved successfully. Rows affected:", result.affectedRows);

        // Send OTP email
        const emailResult = await sendPasswordResetEmail(email, results[0].full_name, otp);

        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "OTP sent to your email. Please check your inbox."
        });
      });
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Reset Password with OTP// Reset Password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide email, OTP, and new password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must include at least one uppercase letter." });
    }
    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must include at least one lowercase letter." });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must include at least one number." });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must include at least one special character (e.g. @, #, !)." });
    }

    const query = `
      SELECT * FROM readers
      WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()
    `;

    db.query(query, [email, otp], async (err, results) => {
      if (err) {
        console.error("Database error in resetPassword:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      // Debug logging
      console.log("Reset Password Debug:");
      console.log("Email:", email);
      console.log("OTP provided:", otp);
      console.log("Results found:", results.length);
      
      // Check if user exists with this email
      const checkUserQuery = "SELECT email, otp_code, otp_expiry FROM readers WHERE email = ?";
      db.query(checkUserQuery, [email], (checkErr, checkResults) => {
        if (checkResults && checkResults.length > 0) {
          console.log("User found in DB:");
          console.log("Stored OTP:", checkResults[0].otp_code);
          console.log("OTP Expiry:", checkResults[0].otp_expiry);
          console.log("Current Time:", new Date());
        }
      });

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP. Please request a new one."
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const updateQuery = `
        UPDATE readers
        SET password = ?, otp_code = NULL, otp_expiry = NULL
        WHERE email = ?
      `;

      db.query(updateQuery, [hashedPassword, email], (err, result) => {
        if (err) {
          console.error("Database error in resetPassword update:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to reset password. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "Password reset successfully. You can now login with your new password."
        });
      });
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Verify Email with OTP
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP"
      });
    }

    const query = `
      SELECT * FROM readers
      WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()
    `;

    db.query(query, [email, otp], (err, results) => {
      if (err) {
        console.error("Database error in verifyEmail:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired OTP. Please request a new one."
        });
      }

      const updateQuery = `
        UPDATE readers
        SET is_verified = 1, otp_code = NULL, otp_expiry = NULL
        WHERE email = ?
      `;

      db.query(updateQuery, [email], (err, result) => {
        if (err) {
          console.error("Database error in verifyEmail update:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to verify email. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "Email verified successfully!"
        });
      });
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body; // type: 'email_verification' or 'password_reset'

    if (!email || !type) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP type"
      });
    }

    const query = "SELECT * FROM readers WHERE email = ?";
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error("Database error in resendOTP:", err);
        return res.status(500).json({
          success: false,
          message: "Server error. Please try again later"
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No account found with this email address"
        });
      }

      const user = results[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      let updateQuery, emailResult;

      // Both email verification and password reset use the same otp_code and otp_expiry columns
      // Use MySQL's DATE_ADD to avoid timezone issues
      updateQuery = `
        UPDATE readers
        SET otp_code = ?, otp_expiry = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        WHERE email = ?
      `;
      
      db.query(updateQuery, [otp, email], async (err, result) => {
        if (err) {
          console.error("Database error in resendOTP update:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to generate OTP. Please try again"
          });
        }

        // Send appropriate email based on type
        if (type === 'email_verification') {
          emailResult = await sendOTPEmail(email, user.full_name, otp);
        } else if (type === 'password_reset') {
          emailResult = await sendPasswordResetEmail(email, user.full_name, otp);
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid OTP type. Use 'email_verification' or 'password_reset'"
          });
        }

        if (!emailResult.success) {
          return res.status(500).json({
            success: false,
            message: "Failed to send OTP email. Please try again"
          });
        }

        res.status(200).json({
          success: true,
          message: "OTP sent to your email. Please check your inbox."
        });
      });
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later"
    });
  }
};

module.exports = {
  registerReader,
  verifyRegisterOTP,
  loginReader,
  verifyLoginOTP,
  getReaderProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendOTP
};