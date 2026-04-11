import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readerAPI } from "../services/api";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await readerAPI.forgotPassword(email);
      
      if (response.success) {
        setMessage({ type: "success", text: response.message });
        setStep(2);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to send OTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await readerAPI.resetPassword({
        email,
        otp,
        newPassword
      });
      
      if (response.success) {
        setMessage({ type: "success", text: response.message });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to reset password" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await readerAPI.resendOTP(email, "password_reset");
      
      if (response.success) {
        setMessage({ type: "success", text: "OTP resent successfully!" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to resend OTP" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {/* Step Indicator */}
          <div className="forgot-step-indicator">
            <div className={`forgot-step ${step === 1 ? 'active' : 'completed'}`}>
              <div className="forgot-step-circle">1</div>
              <span className="forgot-step-label">Email</span>
            </div>
            <div className="forgot-step-divider"></div>
            <div className={`forgot-step ${step === 2 ? 'active' : ''}`}>
              <div className="forgot-step-circle">2</div>
              <span className="forgot-step-label">Reset</span>
            </div>
          </div>

          <div className="forgot-password-header">
            <h1>Reset Password</h1>
            <p>
              {step === 1 
                ? "Enter your email to receive a password reset OTP" 
                : "Enter the OTP sent to your email and your new password"}
            </p>
          </div>

          {message.text && (
            <div className={`forgot-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="forgot-password-form">
              <div className="forgot-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="forgot-submit-btn" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <div className="forgot-password-footer">
                <p>
                  Remember your password?{" "}
                  <Link to="/login">Sign In</Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="forgot-password-form">
              <div className="forgot-form-group">
                <label htmlFor="otp">OTP Code</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                  disabled={loading}
                  autoComplete="one-time-code"
                />
                <small className="forgot-form-hint">
                  Didn't receive OTP?{" "}
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="forgot-resend-btn"
                    disabled={loading}
                  >
                    Resend
                  </button>
                </small>
              </div>

              <div className="forgot-form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="forgot-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="forgot-submit-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="forgot-password-footer">
                <p>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="forgot-back-btn"
                    disabled={loading}
                  >
                    ← Back to email
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
