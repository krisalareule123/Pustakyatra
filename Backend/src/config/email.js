const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify((error) => {
  if (error) {
    console.log("❌ Email configuration error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

const sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: "Welcome to Pustakyatra - Your Literary Journey Begins! 📚",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b5723; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">📚 Pustakyatra</h1>
          <p style="margin: 10px 0 0;">Nepal's Digital Library</p>
        </div>

        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a2912;">Welcome, ${userName}! 🎉</h2>
          <p>Thank you for joining Pustakyatra. Your account has been created successfully.</p>
          <p>You can now explore Nepali books, discover authors, and enjoy your reading journey.</p>
          <p style="margin-top: 30px;">Happy reading! 📚<br><strong>The Pustakyatra Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Pustakyatra</strong></p>
          <p style="margin: 5px 0;">Kathmandu, Nepal</p>
          <p style="margin: 5px 0;">pustakyatra072@gmail.com</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (userEmail, userName, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: "Verify Your Email - Pustakyatra 🔐",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b5723; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">📚 Pustakyatra</h1>
          <p style="margin: 10px 0 0;">Email Verification</p>
        </div>

        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a2912;">Hello, ${userName}!</h2>
          <p>Please use the following OTP to verify your email address:</p>
          
          <div style="background: #f8f9fa; border: 2px dashed #3b5723; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3b5723; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>

          <p style="color: #dc3545; font-weight: bold;">⏰ This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The Pustakyatra Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Pustakyatra</strong></p>
          <p style="margin: 5px 0;">Kathmandu, Nepal</p>
          <p style="margin: 5px 0;">pustakyatra072@gmail.com</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (userEmail, userName, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: "Reset Your Password - Pustakyatra 🔒",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 12px; overflow: hidden;">
        <div style="background: #3b5723; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">📚 Pustakyatra</h1>
          <p style="margin: 10px 0 0;">Password Reset Request</p>
        </div>

        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1a2912;">Hello, ${userName}!</h2>
          <p>We received a request to reset your password. Use the following OTP to reset your password:</p>
          
          <div style="background: #f8f9fa; border: 2px dashed #3b5723; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #3b5723; font-size: 36px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>

          <p style="color: #dc3545; font-weight: bold;">⏰ This OTP will expire in 10 minutes.</p>
          <p style="color: #856404; background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
            <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
          </p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>The Pustakyatra Team</strong></p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p style="margin: 5px 0;"><strong>Pustakyatra</strong></p>
          <p style="margin: 5px 0;">Kathmandu, Nepal</p>
          <p style="margin: 5px 0;">pustakyatra072@gmail.com</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", userEmail);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail };