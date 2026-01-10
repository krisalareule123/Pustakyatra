import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();   // ✅ added

  function handleSubmit(e) {
    e.preventDefault();

    // Demo user data - in real app this would come from backend
    const userData = {
      fullName: email.includes('krisala') ? 'Krisala Reule' : 'Demo User',
      email: email,
      role: role,
      id: '1'
    };

    // Store auth token and user data in localStorage
    localStorage.setItem('authToken', 'demo-jwt-token-' + Date.now());
    localStorage.setItem('userData', JSON.stringify(userData));

    // Trigger custom event to update navbar
    window.dispatchEvent(new Event('userLoggedIn'));

    // Navigate to dashboard
    navigate("/dashboard");
  }

  return (
    <main className="loginWrap">
      <div className="loginContainer">
        <div className="loginHeader">
          <h1 className="loginTitle">Welcome Back</h1>
          <p className="loginSub">
            Continue your reading journey with Pustakyatra's digital library
          </p>
        </div>

        <div className="loginCard">
          <div className="loginRole">
            <button
              type="button"
              className={role === "reader" ? "active" : ""}
              onClick={() => setRole("reader")}
            >
              Reader
            </button>
            <button
              type="button"
              className={role === "author" ? "active" : ""}
              onClick={() => setRole("author")}
            >
              Author
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="loginRow">
              <label className="remember">
                <input type="checkbox" />
                Remember me
              </label>

              <button className="loginBtn" type="submit">
                Sign In
              </button>
            </div>

            <div className="loginLinks">
              <span className="muted">Forgot your password? Contact support</span>
              <div>
                Don&apos;t have an account?{" "}
                <Link to="/register">Create Account</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
