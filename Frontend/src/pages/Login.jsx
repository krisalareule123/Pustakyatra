import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readerAPI, authorAPI } from "../services/api";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials"); // "credentials" | "otp"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        navigate(user.role === 'author' ? '/author/dashboard' : '/', { replace: true });
      } catch { navigate('/', { replace: true }); }
    }
  }, [navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Step 1: Submit email + password
  async function handleCredentials(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const credentials = { email: email.trim(), password };

      if (role === "author") {
        const response = await authorAPI.login(credentials);
        if (response.requiresOTP) {
          // Author not verified — backend sent new OTP
          setStep("otp");
          setResendTimer(60);
        } else {
          // Verified author — save with author-specific keys
          localStorage.setItem("authorToken", response.token);
          localStorage.setItem("authorData", JSON.stringify(response.author));
          navigate("/author/dashboard");
        }
      } else {
        // Reader: request OTP
        const response = await readerAPI.login(credentials);
        console.log("Login response:", response);
        if (response.requiresOTP) {
          setStep("otp");
          setResendTimer(60);
        } else {
          // Unexpected: backend returned success but no OTP flag
          setError("Unexpected response from server. Please try again.");
        }
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function handleOTPVerify(e) {
    e.preventDefault();
    setError("");

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      if (role === "author") {
        const response = await authorAPI.verifyEmail(email, otp.trim());
        localStorage.setItem("authorToken", response.token);
        localStorage.setItem("authorData", JSON.stringify(response.author));
        navigate("/author/dashboard");
      } else {
        const response = await readerAPI.verifyLoginOTP(email, otp.trim());
        localStorage.setItem("token", response.token);
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("userData", JSON.stringify({ ...response.user, role: "reader" }));
        window.dispatchEvent(new Event("userLoggedIn"));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function handleResendOTP() {
    setError("");
    setOtp("");
    try {
      await readerAPI.login({ email, password });
      setResendTimer(60);
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    }
  }

  return (
    <main className="loginWrap">
      <div className="loginContainer">
        <div className="loginHeader">
          <h1 className="loginTitle">
            {step === "otp" ? "Verify Your Identity" : "Welcome Back"}
          </h1>
          <p className="loginSub">
            {step === "otp"
              ? `We sent a 6-digit code to ${email}`
              : "Continue your reading journey with Pustakyatra's digital library"}
          </p>
        </div>

        <div className="loginCard">
          {step === "credentials" && (
            <>
              <div className="loginRole">
                <button type="button" className={role === "reader" ? "active" : ""} onClick={() => setRole("reader")}>Reader</button>
                <button type="button" className={role === "author" ? "active" : ""} onClick={() => setRole("author")}>Author</button>
              </div>

              <form onSubmit={handleCredentials}>
                <div>
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required disabled={loading} />
                </div>
                <div>
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{
                        position: "absolute", right: 12, top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", cursor: "pointer", color: "#888",
                        fontSize: 16, padding: 0, lineHeight: 1
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                </div>

                {error && <div className="loginError">{error}</div>}

                <div className="loginRow">
                  <label className="remember"><input type="checkbox" /> Remember me</label>
                  <button className="loginBtn" type="submit" disabled={loading}>
                    {loading ? "Checking..." : "Continue"}
                  </button>
                </div>

                <div className="loginLinks">
                  <Link to="/forgot-password" className="forgot-link">Forgot your password?</Link>
                  <div>Don&apos;t have an account? <Link to="/register">Create Account</Link></div>
                </div>
              </form>
            </>
          )}

          {step === "otp" && (
            <form onSubmit={handleOTPVerify} className="otpForm" autoComplete="off">
              <div className="otpIconWrap">
                <span className="otpIcon">📧</span>
              </div>

              <div>
                <label htmlFor="login-otp">Enter OTP</label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="otpInput"
                  autoFocus
                  disabled={loading}
                />
              </div>

              {error && <div className="loginError">{error}</div>}

              <button className="loginBtn" type="submit" disabled={loading || otp.length !== 6}>
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>

              <div className="otpResend">
                {resendTimer > 0 ? (
                  <span className="otpTimer">Resend OTP in {resendTimer}s</span>
                ) : (
                  <button type="button" className="otpResendBtn" onClick={handleResendOTP}>
                    Resend OTP
                  </button>
                )}
                <button type="button" className="otpBackBtn" onClick={() => { setStep("credentials"); setError(""); setOtp(""); }}>
                  ← Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
