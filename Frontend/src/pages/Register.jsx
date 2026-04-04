import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readerAPI, authorAPI } from "../services/api";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        navigate(user.role === "author" ? "/author/dashboard" : "/", { replace: true });
      } catch { navigate("/", { replace: true }); }
    }
  }, [navigate]);
  const [role, setRole] = useState("reader");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const isAuthor = role === "author";

  const roleTitle = useMemo(() => isAuthor ? "Create an Author account" : "Create a Reader account", [isAuthor]);
  const roleDesc = useMemo(() =>
    isAuthor
      ? "Publish your work and reach readers through Pustakyatra."
      : "Save favorites, build your reading list, and explore Nepali books.",
    [isAuthor]
  );

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  function updateField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // Validation helpers
  function validateFullName(name) {
    const trimmed = name.trim();
    if (/[^a-zA-Z\s]/.test(trimmed)) {
      return "Full name should only contain letters.";
    }
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      return "Please enter your full name (first and last name).";
    }
    if (words.some(w => w.length < 2)) {
      return "Each part of your name must be at least 2 letters.";
    }
    return null;
  }

  function validatePassword(pwd) {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must include at least one uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must include at least one lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must include at least one number.";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must include at least one special character (e.g. @, #, !).";
    return null;
  }

  // Step 1: Submit registration form
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    const nameError = validateFullName(form.fullName);
    if (nameError) { setError(nameError); return; }

    const pwdError = validatePassword(form.password);
    if (pwdError) { setError(pwdError); return; }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const userData = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      if (isAuthor) {
        const response = await authorAPI.register(userData);
        if (response.requiresOTP) {
          setStep("otp");
          setResendTimer(60);
        } else {
          // Fallback: already verified (shouldn't happen on fresh register)
          localStorage.setItem("authorToken", response.token);
          localStorage.setItem("authorData", JSON.stringify(response.author));
          navigate("/author/dashboard");
        }
      } else {
        // Readers: register → OTP verification required
        const response = await readerAPI.register(userData);
        if (response.requiresOTP) {
          setStep("otp");
          setResendTimer(60);
        }
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
      if (isAuthor) {
        const response = await authorAPI.verifyEmail(form.email.trim(), otp.trim());
        localStorage.setItem("authorToken", response.token);
        localStorage.setItem("authorData", JSON.stringify(response.author));
        navigate("/author/dashboard");
      } else {
        const response = await readerAPI.verifyRegisterOTP(form.email.trim(), otp.trim());
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
      if (isAuthor) {
        await authorAPI.resendOTP(form.email.trim());
      } else {
        try {
          await readerAPI.register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
        } catch {
          await readerAPI.resendOTP(form.email.trim(), "email_verification");
        }
      }
      setResendTimer(60);
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    }
  }

  // OTP step UI
  if (step === "otp") {
    return (
      <div className="regPage">
        <main className="regContainer">
          <section className="regShell regShellOTP">
            <section className="regCard">
              <header className="regHeader" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📧</div>
                <h2 className="regTitle">Verify Your Email</h2>
                <p className="regSubtitle">
                  We sent a 6-digit code to <strong>{form.email}</strong>
                </p>
              </header>

              <form className="regForm" onSubmit={handleOTPVerify} autoComplete="off">
                <div className="field">
                  <label htmlFor="reg-otp">Enter OTP</label>
                  <input
                    id="reg-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="otpInputField"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                {error && <div className="msg error">{error}</div>}

                <button className="regSubmit" type="submit" disabled={loading || otp.length !== 6}>
                  {loading ? "Verifying..." : "Verify & Continue"} <span className="arrow">→</span>
                </button>

                <div className="regFooterRow" style={{ justifyContent: "space-between" }}>
                  {resendTimer > 0 ? (
                    <span style={{ color: "#6c757d", fontSize: 14 }}>Resend OTP in {resendTimer}s</span>
                  ) : (
                    <button type="button" className="otpResendBtn" onClick={handleResendOTP}>
                      Resend OTP
                    </button>
                  )}
                  <button
                    type="button"
                    className="otpResendBtn"
                    onClick={() => { setStep("form"); setError(""); setOtp(""); }}
                  >
                    ← Back
                  </button>
                </div>
              </form>
            </section>
          </section>
        </main>
      </div>
    );
  }

  // Registration form UI
  return (
    <div className="regPage">
      <main className="regContainer">
        <section className="regShell">
          <aside className="regSide">
            <div className="regSidePill">PUSTAKYATRA • Calm Nepali Digital Library</div>
            <h1 className="regSideTitle">
              Join Pustakyatra <span className="regSideAccent">today.</span>
            </h1>
            <p className="regSideText">
              A warm, simple space to read Nepali literature — and for authors to publish with ease.
              {isAuthor && " Complete your author profile, add your bio, and start publishing after registration."}
            </p>
            <div className="regSideStats">
              <div className="regStat"><div className="regStatNum">12k+</div><div className="regStatLabel">Readers</div></div>
              <div className="regStat"><div className="regStatNum">2.5k+</div><div className="regStatLabel">Books</div></div>
              <div className="regStat"><div className="regStatNum">450+</div><div className="regStatLabel">Authors</div></div>
            </div>
            <div className="regSideNote">
              {isAuthor
                ? "Complete your author profile after registration in your dashboard."
                : "You can switch account type anytime before submitting."}
            </div>
          </aside>

          <section className="regCard">
            <header className="regHeader">
              <div className="regHeaderTop">
                <h2 className="regTitle">{roleTitle}</h2>
                <div className="roleToggle">
                  <button type="button" className={`roleBtn ${role === "reader" ? "active" : ""}`} onClick={() => setRole("reader")}>Reader</button>
                  <button type="button" className={`roleBtn ${role === "author" ? "active" : ""}`} onClick={() => setRole("author")}>Author</button>
                </div>
              </div>
              <p className="regSubtitle">{roleDesc}</p>
            </header>

            <form className="regForm" onSubmit={handleSubmit} autoComplete="on">
              <div className="regGrid">
                <div className="field">
                  <label htmlFor="reg-name">Full Name<span>*</span></label>
                  <input
                    id="reg-name"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="e.g., Krisala Reule"
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-email">Email<span>*</span></label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-password">Password<span>*</span></label>
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="field">
                  <label htmlFor="reg-confirm">Confirm Password<span>*</span></label>
                  <input
                    id="reg-confirm"
                    type="password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {error && <div className="msg error">{error}</div>}

              <button className="regSubmit" type="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"} <span className="arrow">→</span>
              </button>

              <div className="regFooterRow">
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
