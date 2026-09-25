import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiLock, FiCheck } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

import ssecLogo from "../assets/rename.png";
import "./ActivateAccount.css";

function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read token from hash fragment (#token=) or fallback to query parameter (?token=) (M-8)
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashToken = hashParams.get("token");
      if (hashToken) return hashToken;
    }
    return searchParams.get("token") || "";
  });

  // Strip token immediately from URL / history to prevent leakage (M-8)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasHashToken = window.location.hash && window.location.hash.includes("token=");
      const url = new URL(window.location.href);
      const hasQueryToken = url.searchParams.has("token");
      if (hasHashToken || hasQueryToken) {
        url.searchParams.delete("token");
        url.hash = "";
        const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password rules validation
  const rules = {
    length: password.length >= 8 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invalid or missing activation token. Please check your email link.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all security requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/auth/activate-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to activate account. The link may have expired.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Activation error:", err);
      setError("Unable to connect to server. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activate-page">
      {/* ── Top Navbar ── */}
      <nav className="activate-navbar">
        <div className="activate-navbar-brand">
          <img src={ssecLogo} alt="SSISM Logo" className="activate-navbar-logo" />
          <div className="activate-navbar-text">
            <span className="activate-navbar-name">SSISM</span>
            <span className="activate-navbar-full">Singaji Education Society</span>
          </div>
        </div>
      </nav>

      {/* ── Main Content Area ── */}
      <div className="activate-content">
        <div className="activate-card">
          <div className="activate-logo-wrapper">
            <img src={ssecLogo} alt="SSISM Logo" className="activate-logo" />
          </div>

          <h2 className="activate-title">Activate Faculty Account</h2>
          <p className="activate-subtitle">
            Set your secure personal password to activate your account
          </p>

          {!token ? (
            <div className="activate-error-banner">
              <FiAlertCircle size={20} />
              <div>
                <strong>Invalid Link</strong>
                <p>No activation token was detected. Please use the link sent to your registered institutional email.</p>
              </div>
            </div>
          ) : success ? (
            <div className="activate-success-card">
              <FiCheckCircle size={48} className="activate-success-icon" />
              <h3>Account Activated Successfully!</h3>
              <p>Your password has been securely saved. You can now sign in to access your portal.</p>
              <button
                type="button"
                className="activate-btn"
                onClick={() => navigate("/login")}
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="activate-form">
              <div className="activate-form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="activate-input-wrapper">
                  <FiLock className="activate-input-icon" />
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="activate-form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="activate-input-wrapper">
                  <FiLock className="activate-input-icon" />
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Password Requirement Badges */}
              <div className="activate-rules">
                <p className="activate-rules-title">Password must include:</p>
                <ul className="activate-rules-list">
                  <li className={rules.length ? "valid" : ""}>
                    <FiCheck size={13} /> At least 8 characters
                  </li>
                  <li className={rules.upper ? "valid" : ""}>
                    <FiCheck size={13} /> At least one uppercase letter (A-Z)
                  </li>
                  <li className={rules.lower ? "valid" : ""}>
                    <FiCheck size={13} /> At least one lowercase letter (a-z)
                  </li>
                  <li className={rules.number ? "valid" : ""}>
                    <FiCheck size={13} /> At least one number (0-9)
                  </li>
                  <li className={rules.special ? "valid" : ""}>
                    <FiCheck size={13} /> At least one special character (!@#$...)
                  </li>
                </ul>
              </div>

              {error && (
                <div className="activate-error">
                  <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="activate-btn"
                disabled={isLoading || !isPasswordValid || password !== confirmPassword}
              >
                {isLoading ? "Setting Password…" : "Activate Account & Save Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivateAccount;
