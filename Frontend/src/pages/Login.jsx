import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { readerAPI, authorAPI } from "../services/api";
import "./Login.css";

export default function Login() {
  const [role, setRole] = useState("reader");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      if (user.role === 'author') {
        navigate('/author/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // Prepare credentials
      const credentials = {
        email: email.trim(),
        password: password,
      };

      // Call appropriate API based on role
      const response = role === "author"
        ? await authorAPI.login(credentials)
        : await readerAPI.login(credentials);

      // Store auth token and user data (use both 'token' and 'authToken' for compatibility)
      localStorage.setItem('token', response.token);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userData', JSON.stringify({
        ...response.user,
        role: role
      }));

      // Trigger custom event to update navbar
      window.dispatchEvent(new Event('userLoggedIn'));

      // Navigate based on user role
      if (role === "author") {
        navigate("/author/dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      // Display the specific error message from backend
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px",
                background: "#fee",
                border: "1px solid #fcc",
                borderRadius: "8px",
                color: "#c33",
                fontSize: "14px",
                marginBottom: "16px"
              }}>
                {error}
              </div>
            )}

            <div className="loginRow">
              <label className="remember">
                <input type="checkbox" />
                Remember me
              </label>

              <button className="loginBtn" type="submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </div>

            <div className="loginLinks">
              <Link to="/forgot-password" className="forgot-link">
                Forgot your password?
              </Link>
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
