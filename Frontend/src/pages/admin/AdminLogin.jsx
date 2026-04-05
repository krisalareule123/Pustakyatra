import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLayout.css";

// Hardcoded admin credentials for now — replace with backend auth later
const ADMIN_EMAIL    = "admin@pustakyatra.com";
const ADMIN_PASSWORD = "Admin@2025";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem("adminToken", "admin-session-token");
        localStorage.setItem("adminData", JSON.stringify({ name: "Admin", email }));
        navigate("/admin/dashboard");
      } else {
        setError("Invalid admin credentials.");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <div className="admin-login-logo-dot">P</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a2912" }}>Pustakyatra</div>
            <div style={{ fontSize: 11, color: "#888" }}>Admin Portal</div>
          </div>
        </div>

        <h2 className="admin-login-title">Admin Sign In</h2>
        <p className="admin-login-sub">Access the Pustakyatra management panel</p>

        <form onSubmit={handleLogin}>
          <div className="admin-login-field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@pustakyatra.com" required />
          </div>
          <div className="admin-login-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password" required />
          </div>
          {error && <p className="admin-login-error">{error}</p>}
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Admin Panel"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#bbb" }}>
          This portal is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
