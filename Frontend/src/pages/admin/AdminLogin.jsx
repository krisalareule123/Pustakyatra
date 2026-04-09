import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const API = "http://localhost:5001/api/admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Clear any stale token when landing on login page
  useEffect(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData",  JSON.stringify(data.admin));
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Invalid credentials.");
      }
    } catch {
      setError("Could not connect to server. Make sure backend is running on port 5001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-logo-dot">P</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1a2912", letterSpacing: "-0.3px" }}>
              Pustakyatra
            </div>
            <div style={{ fontSize: 11, color: "#3b5723", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              Admin Portal
            </div>
          </div>
        </div>

        <h2 className="admin-login-title">Admin Sign In</h2>
        <p className="admin-login-sub">Sign in to manage books, users, and platform activity</p>

        <form onSubmit={handleLogin}>
          <div className="admin-login-field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@pustakyatra.com" required autoFocus />
          </div>
          <div className="admin-login-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password" required />
          </div>
          {error && (
            <div className="admin-login-error">
              <span>⚠️</span> {error}
            </div>
          )}
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Admin Panel →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#bbb" }}>
          Restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
