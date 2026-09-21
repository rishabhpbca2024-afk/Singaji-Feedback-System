import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

import ssecLogo from "../assets/rename.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
         credentials: "include",
        body: JSON.stringify({
          gmail: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      // Login successful
      login({
        id: data.user.id || data.user._id,
        facultyId: data.user.facultyId,
        email: data.user.gmail,
        role: data.role,
        name: data.user.name,
        department: data.user.department,
        subjects: data.user.subjects,
        isActive: data.user.isActive,
        mustChangePassword: data.mustChangePassword ?? data.user?.mustChangePassword ?? false,
      });

      // Role ke according dashboard
      if (data.role === "Faculty") {
        navigate("/faculty/dashboard");
      } else if (data.role === "Admin") {
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ── Top Navbar ── */}
      <nav className="login-navbar">
        <div className="login-navbar-brand">
          <img src={ssecLogo} alt="SSISM Logo" className="login-navbar-logo" />
          <div className="login-navbar-text">
            <span className="login-navbar-name">SSISM</span>
            <span className="login-navbar-full">Singaji Education Society</span>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="login-content">

        {/* ── Left Branding ── */}
        <div className="login-branding">
          <p className="login-branding-tagline">Welcome to</p>
          <h1 className="login-branding-title">SANT SINGAJI EDUCATIONAL<br />SOCIETY<br /></h1>
          <div className="login-branding-divider"></div>
          <p className="login-branding-sub">Empowering Quality Education Through Feedback</p>
        </div>

        {/* ── Right Login Card ── */}
        <div className="login-card">

          <div className="login-logo-wrapper">
            <img src={ssecLogo} alt="SSISM Logo" className="login-logo" />
          </div>

          <h2 className="login-title">Sign In</h2>
          <p className="login-subtitle">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="login-form">

            <div className="login-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="login-error">
                <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-btn-loading">
                  <span className="login-spinner"></span>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

export default Login;