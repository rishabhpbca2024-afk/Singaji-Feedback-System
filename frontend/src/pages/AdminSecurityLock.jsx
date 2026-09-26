import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiShield,
  FiAlertTriangle,
  FiLock,
  FiCheckCircle,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL;

import ssecLogo from "../assets/rename.png";
import "./AdminSecurityLock.css";

function AdminSecurityLock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read emergency token or reset token from hash fragment (#token= or #resetToken=)
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashToken = hashParams.get("token");
      if (hashToken) return hashToken;
    }
    return searchParams.get("token") || "";
  });

  const [resetToken, setResetToken] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const rToken = hashParams.get("resetToken");
      if (rToken) return rToken;
    }
    return searchParams.get("resetToken") || "";
  });

  // Step: 'confirm' (lock button), 'emailSent' (link emailed), 'reset' (password form), 'success'
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      if (hashParams.get("resetToken")) return "reset";
    }
    if (searchParams.get("resetToken")) return "reset";
    return "confirm";
  });

  // Strip tokens immediately from URL / history to prevent leakage (M-8)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasHashToken =
        window.location.hash &&
        (window.location.hash.includes("token=") || window.location.hash.includes("resetToken="));
      const url = new URL(window.location.href);
      const hasQueryToken = url.searchParams.has("token") || url.searchParams.has("resetToken");
      if (hasHashToken || hasQueryToken) {
        url.searchParams.delete("token");
        url.searchParams.delete("resetToken");
        url.hash = "";
        const cleanUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  const [adminGmail, setAdminGmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Institutional Password Rules
  const rules = {
    length: password.length >= 8 && password.length <= 128,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Step 1: Trigger Emergency Lock
  const handleTriggerLock = async () => {
    if (!token) {
      setError("Emergency security token is missing from the link.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/auth/admin-emergency-lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid or expired emergency link.");
        return;
      }

      setAdminGmail(data.adminGmail || "");
      setStep("emailSent");
    } catch (err) {
      console.error("Emergency lock error:", err);
      setError("Unable to connect to security server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set New Password & Unlock
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      setError("Recovery session expired. Please open the email link again.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please ensure your new password satisfies all institutional security rules.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/auth/admin-emergency-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resetToken,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to reset password. Please try again.");
        return;
      }

      setStep("success");
    } catch (err) {
      console.error("Emergency reset error:", err);
      setError("Unable to connect to security server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="asl-page">
      {/* ── Top Navbar ── */}
      <nav className="asl-navbar">
        <div className="asl-navbar-brand">
          <img src={ssecLogo} alt="SSISM Logo" className="asl-navbar-logo" />
          <div className="asl-navbar-text">
            <span className="asl-navbar-name">SSISM Security Portal</span>
            <span className="asl-navbar-full">Singaji Education Society</span>
          </div>
        </div>
      </nav>

      {/* ── Content Card ── */}
      <div className="asl-container">
        <div className="asl-card">
          <div className="asl-logo-wrap">
            <img src={ssecLogo} alt="SSISM Logo" className="asl-logo" />
          </div>

          {!token && !resetToken ? (
            <div className="asl-error-banner">
              <FiAlertTriangle size={24} className="asl-err-icon" />
              <div>
                <h3>Missing Security Token</h3>
                <p>
                  No emergency security token was found in this link. Please ensure you
                  opened the complete link sent to your registered Gmail address.
                </p>
              </div>
            </div>
          ) : step === "confirm" ? (
            /* ── STEP 1: CONFIRM EMERGENCY FREEZE ── */
            <div className="asl-step-confirm">
              <div className="asl-badge-alert">
                <FiAlertTriangle size={18} />
                <span>Critical Security Action</span>
              </div>

              <h2 className="asl-title">Freeze Admin Account & Terminate Sessions</h2>
              <p className="asl-subtitle">
                You received this security link because your Administrator account password
                was recently changed.
              </p>

              <div className="asl-info-box">
                <p>
                  If you <strong>did not authorize</strong> this password change, clicking
                  below will immediately:
                </p>
                <ul>
                  <li>
                    <FiCheck size={14} /> <strong>Kill all active sessions</strong> across every browser and device immediately.
                  </li>
                  <li>
                    <FiCheck size={14} /> <strong>Lock the administrator account</strong> to block any further unauthorized logins.
                  </li>
                  <li>
                    <FiCheck size={14} /> <strong>Send a password reset link</strong> directly to your registered Gmail to reclaim your account.
                  </li>
                </ul>
              </div>

              {error && (
                <div className="asl-error-msg">
                  <FiAlertTriangle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                className="asl-btn-lock"
                onClick={handleTriggerLock}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Locking Account & Terminating Sessions…"
                ) : (
                  <>
                    <FiShield size={18} /> Lock Account & Send Recovery Link
                  </>
                )}
              </button>

              <p className="asl-safe-note">
                Did you change the password yourself? If so, you can safely close this page.
              </p>
            </div>
          ) : step === "emailSent" ? (
            /* ── STEP: EMAIL SENT AFTER FREEZE ── */
            <div className="asl-step-confirm">
              <div className="asl-badge-locked">
                <FiCheckCircle size={18} />
                <span>Account Freeze Applied</span>
              </div>

              <h2 className="asl-title">Account Locked & Sessions Terminated</h2>
              <p className="asl-subtitle">
                Your administrator account has been safely locked. All active sessions have been invalidated across all browsers and devices.
              </p>

              <div className="asl-info-box">
                <p>
                  To choose a new secure password and unlock your account, a single-use password reset link has been dispatched to:
                </p>
                <p style={{ fontWeight: "bold", color: "#1e293b", margin: "10px 0", fontSize: "16px" }}>
                  {adminGmail || "your registered institutional Gmail"}
                </p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Please check your Gmail inbox within <strong>15 minutes</strong> and open the link to set your new password.
                </p>
              </div>

              <p className="asl-safe-note">
                You can now safely close this window and proceed from your email.
              </p>
            </div>
          ) : step === "reset" ? (
            /* ── STEP 2: SET NEW PASSWORD ── */
            <div className="asl-step-reset">
              <div className="asl-badge-locked">
                <FiShield size={18} />
                <span>Account Locked & Sessions Terminated</span>
              </div>

              <h2 className="asl-title">Set Your New Secure Password</h2>
              <p className="asl-subtitle">
                All unauthorized sessions have been terminated. Please enter a new institutional
                password to unlock your account {adminGmail ? `(${adminGmail})` : ""}.
              </p>

              <form onSubmit={handleResetPassword} className="asl-form">
                {/* New Password */}
                <div className="asl-form-group">
                  <label htmlFor="asl-new-pwd">New Administrator Password</label>
                  <div className="asl-input-wrap">
                    <FiLock className="asl-field-icon" />
                    <input
                      id="asl-new-pwd"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="asl-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="asl-form-group">
                  <label htmlFor="asl-conf-pwd">Confirm New Password</label>
                  <div className="asl-input-wrap">
                    <FiLock className="asl-field-icon" />
                    <input
                      id="asl-conf-pwd"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="asl-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex="-1"
                    >
                      {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Checklist */}
                <div className="asl-checklist-box">
                  <span className="asl-checklist-title">Password must include:</span>
                  <div className="asl-checklist-grid">
                    <div className={`asl-check-item ${rules.length ? "valid" : ""}`}>
                      <FiCheck size={13} /> At least 8 characters
                    </div>
                    <div className={`asl-check-item ${rules.upper ? "valid" : ""}`}>
                      <FiCheck size={13} /> One uppercase letter (A-Z)
                    </div>
                    <div className={`asl-check-item ${rules.lower ? "valid" : ""}`}>
                      <FiCheck size={13} /> One lowercase letter (a-z)
                    </div>
                    <div className={`asl-check-item ${rules.number ? "valid" : ""}`}>
                      <FiCheck size={13} /> One number (0-9)
                    </div>
                    <div className={`asl-check-item ${rules.special ? "valid" : ""}`}>
                      <FiCheck size={13} /> One special character (!@#$...)
                    </div>
                    <div className={`asl-check-item ${passwordsMatch ? "valid" : ""}`}>
                      <FiCheck size={13} /> Passwords match
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="asl-error-msg">
                    <FiAlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="asl-btn-submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                >
                  {isLoading ? "Saving Password & Unlocking Account…" : "Unlock Account & Save New Password"}
                </button>
              </form>
            </div>
          ) : (
            /* ── STEP 3: SUCCESS ── */
            <div className="asl-step-success">
              <div className="asl-success-icon-wrap">
                <FiCheckCircle size={56} className="asl-success-icon" />
              </div>

              <h2 className="asl-title">Account Successfully Recovered!</h2>
              <p className="asl-subtitle">
                Your password has been reset securely and your administrator account is now
                fully unlocked. All prior unauthorized sessions remain terminated.
              </p>

              <button
                type="button"
                className="asl-btn-login"
                onClick={() => navigate("/login")}
              >
                Proceed to Admin Sign In <FiArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSecurityLock;
