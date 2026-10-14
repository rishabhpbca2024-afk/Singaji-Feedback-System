import { useState } from "react";
import {
  FiUser,
  FiLock,
  FiDroplet,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiMail,
  FiCheck,
  FiRefreshCw,
  FiLayers,
  FiKey,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import { useTheme } from "../context/ThemeContext.jsx";
import "./AdminSettings.css";

const API_URL = import.meta.env.VITE_API_URL || "";

function AdminSettings() {
  const { user } = useAuth();
  const {
    currentPaletteId,
    activePalette,
    selectPalette,
    palettes,
  } = useTheme();

  // Active Tab state: 'profile' | 'security' | 'appearance'
  const [activeTab, setActiveTab] = useState("profile");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password verification rules
  const rules = {
    length: newPassword.length >= 8 && newPassword.length <= 128,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword),
  };
  const isPasswordValid = Object.values(rules).every(Boolean);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Password Strength calculation
  const strengthScore = Object.values(rules).filter(Boolean).length;
  const getStrengthLabel = () => {
    if (!newPassword) return { text: "None", color: "#94a3b8", width: "0%" };
    if (strengthScore <= 2) return { text: "Weak", color: "#ef4444", width: "33%" };
    if (strengthScore <= 4) return { text: "Good", color: "#f59e0b", width: "66%" };
    return { text: "Strong", color: "#10b981", width: "100%" };
  };
  const strengthInfo = getStrengthLabel();

  // Handle Change Password Form Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("All fields are required.");
      return;
    }

    if (!isPasswordValid) {
      setPwdError("Please ensure your new password satisfies all institutional security rules.");
      return;
    }

    if (!passwordsMatch) {
      setPwdError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPwdError("New password must be different from current password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/api/auth/admin/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPwdError(data.message || "Failed to update password. Please check your current password.");
        return;
      }

      setPwdSuccess("Admin password successfully updated! A security confirmation has been dispatched.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      setPwdError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName =
    !user?.name || user.name.toLowerCase() === "admin"
      ? "Administrator"
      : user.name;
  const userEmail = user?.email || "admin@ssec.edu.in";

  return (
    <div className="admin-settings-container fade-in">
      {/* Top Page Header */}
      <div className="settings-page-header">
        <div className="settings-title-group">
          <h1>Settings & Preferences</h1>
          <p>
            Manage your administrative profile, security credentials, and application visual appearance
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="settings-tabs-nav">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <FiUser size={18} />
          <span>Admin Profile</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <FiLock size={18} />
          <span>Change Password</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === "appearance" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          <FiDroplet size={18} />
          <span>Color Palette</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: ADMIN PROFILE
      ======================================================== */}
      {activeTab === "profile" && (
        <div className="settings-tab-content">
          {/* Profile Hero Card */}
          <div className="profile-hero-card">
            <div className="profile-hero-bg" />
            <div className="profile-hero-content">
              <div className="profile-avatar-large">
                <FiShield size={38} className="profile-shield-icon" />
                <span className="profile-status-dot" title="Active Account" />
              </div>

              <div className="profile-meta">
                <div className="profile-name-row">
                  <h2>{displayName}</h2>
                  <span className="badge-super-admin">Super Admin</span>
                </div>
                <p className="profile-email">
                  <FiMail size={14} /> {userEmail}
                </p>
                <p className="profile-organization">
                  Singaji Educational Society • Institutional Feedback System
                </p>
              </div>

              <div className="profile-hero-actions">
                <button
                  type="button"
                  className="btn-profile-action"
                  onClick={() => setActiveTab("security")}
                >
                  <FiKey size={15} />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  className="btn-profile-action outline"
                  onClick={() => setActiveTab("appearance")}
                >
                  <FiDroplet size={15} />
                  <span>Customize Theme</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div className="profile-grid">
            {/* Account Details Box */}
            <div className="settings-card">
              <div className="settings-card-header">
                <FiUser size={18} className="card-header-icon" />
                <h3>Account Information</h3>
              </div>
              <div className="settings-card-body">
                <div className="info-row">
                  <span className="info-label">Display Name</span>
                  <span className="info-value">{displayName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Official Email</span>
                  <span className="info-value">{userEmail}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Assigned Role</span>
                  <span className="info-value highlight">System Administrator (Tier 1)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Account Status</span>
                  <span className="info-value status-active">
                    <span className="status-indicator" /> Active & Verified
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Institution</span>
                  <span className="info-value">Singaji Educational Society</span>
                </div>
              </div>
            </div>

            {/* Security Overview Box */}
            <div className="settings-card">
              <div className="settings-card-header">
                <FiShield size={18} className="card-header-icon" />
                <h3>Security & Access Control</h3>
              </div>
              <div className="settings-card-body">
                <div className="info-row">
                  <span className="info-label">Account Lockout Protection</span>
                  <span className="info-value text-success">Enabled (5 attempt threshold)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Session Authentication</span>
                  <span className="info-value">HTTP-Only Encrypted Cookie (HS256)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Password Policy</span>
                  <span className="info-value">High Security Institutional Standard</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Credential Verification</span>
                  <span className="info-value">Active Admin Secret Key Validated</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Security Alerts</span>
                  <span className="info-value text-success">Gmail Notifications Dispatched</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Permissions Card */}
          <div className="settings-card permissions-card">
            <div className="settings-card-header">
              <FiLayers size={18} className="card-header-icon" />
              <h3>Administrative Capabilities & Clearances</h3>
            </div>
            <div className="settings-card-body">
              <div className="permissions-grid">
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Student Directory Control</strong>
                    <p>Add, edit, bulk upload, and manage all student accounts</p>
                  </div>
                </div>
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Faculty Oversight</strong>
                    <p>Assign departments, manage credentials, and review teaching performance</p>
                  </div>
                </div>
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Question Bank Administration</strong>
                    <p>Define feedback parameters, create and calibrate evaluation rubrics</p>
                  </div>
                </div>
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Lecture & Schedule Management</strong>
                    <p>Assign daily lecture slots, track attendance, and monitor syllabus coverage</p>
                  </div>
                </div>
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Institutional Feedback Reports</strong>
                    <p>Generate analytical summaries, low-score alerts, and export PDF audits</p>
                  </div>
                </div>
                <div className="permission-item">
                  <FiCheckCircle size={16} className="perm-icon" />
                  <div>
                    <strong>Visual Theme Personalization</strong>
                    <p>Select customized brand palettes and contrast modes for the workspace</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: CHANGE PASSWORD
      ======================================================== */}
      {activeTab === "security" && (
        <div className="settings-tab-content">
          <div className="security-form-wrapper">
            <div className="settings-card security-main-card">
              <div className="settings-card-header">
                <FiLock size={20} className="card-header-icon" />
                <div>
                  <h3>Update Admin Password</h3>
                  <p className="card-subtitle">
                    Ensure your account stays protected with a strong, compliant password
                  </p>
                </div>
              </div>

              <div className="settings-card-body">
                {/* Error Notice */}
                {pwdError && (
                  <div className="settings-alert alert-error">
                    <FiAlertCircle size={18} />
                    <span>{pwdError}</span>
                  </div>
                )}

                {/* Success Notice */}
                {pwdSuccess && (
                  <div className="settings-alert alert-success">
                    <FiCheckCircle size={18} />
                    <span>{pwdSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="pwd-form">
                  {/* Current Password */}
                  <div className="form-group">
                    <label htmlFor="current-pwd">Current Password</label>
                    <div className="input-password-wrapper">
                      <FiLock className="input-icon" size={16} />
                      <input
                        id="current-pwd"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn-toggle-eye"
                        onClick={() => setShowCurrent(!showCurrent)}
                        tabIndex="-1"
                        aria-label="Toggle password visibility"
                      >
                        {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="form-group">
                    <label htmlFor="new-pwd">New Password</label>
                    <div className="input-password-wrapper">
                      <FiKey className="input-icon" size={16} />
                      <input
                        id="new-pwd"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter strong new password"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn-toggle-eye"
                        onClick={() => setShowNew(!showNew)}
                        tabIndex="-1"
                        aria-label="Toggle password visibility"
                      >
                        {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                      <div className="pwd-strength-container">
                        <div className="pwd-strength-bar-bg">
                          <div
                            className="pwd-strength-bar-fill"
                            style={{
                              width: strengthInfo.width,
                              backgroundColor: strengthInfo.color,
                            }}
                          />
                        </div>
                        <span
                          className="pwd-strength-text"
                          style={{ color: strengthInfo.color }}
                        >
                          Strength: {strengthInfo.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label htmlFor="confirm-pwd">Confirm New Password</label>
                    <div className="input-password-wrapper">
                      <FiKey className="input-icon" size={16} />
                      <input
                        id="confirm-pwd"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="btn-toggle-eye"
                        onClick={() => setShowConfirm(!showConfirm)}
                        tabIndex="-1"
                        aria-label="Toggle password visibility"
                      >
                        {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div className="pwd-match-hint">
                        {passwordsMatch ? (
                          <span className="text-success">
                            <FiCheck size={14} /> Passwords match
                          </span>
                        ) : (
                          <span className="text-danger">
                            <FiAlertCircle size={14} /> Passwords do not match
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pwd-form-actions">
                    <button
                      type="submit"
                      className="btn-submit-pwd"
                      disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
                    >
                      {isSubmitting ? (
                        <>
                          <FiRefreshCw className="spin" size={16} />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <FiCheck size={16} />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-cancel-pwd"
                      onClick={() => {
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPwdError("");
                        setPwdSuccess("");
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Password Policy Guidelines Box */}
            <div className="settings-card security-policy-card">
              <div className="settings-card-header">
                <FiShield size={18} className="card-header-icon" />
                <h3>Institutional Rules Checklist</h3>
              </div>
              <div className="settings-card-body">
                <p className="policy-intro">
                  Your new administrator password must fulfill all mandatory requirements below:
                </p>

                <ul className="policy-checklist">
                  <li className={rules.length ? "passed" : ""}>
                    <span className="check-icon">
                      {rules.length ? <FiCheck size={12} /> : null}
                    </span>
                    <span>8 to 128 characters long</span>
                  </li>
                  <li className={rules.upper ? "passed" : ""}>
                    <span className="check-icon">
                      {rules.upper ? <FiCheck size={12} /> : null}
                    </span>
                    <span>At least 1 uppercase letter (A-Z)</span>
                  </li>
                  <li className={rules.lower ? "passed" : ""}>
                    <span className="check-icon">
                      {rules.lower ? <FiCheck size={12} /> : null}
                    </span>
                    <span>At least 1 lowercase letter (a-z)</span>
                  </li>
                  <li className={rules.number ? "passed" : ""}>
                    <span className="check-icon">
                      {rules.number ? <FiCheck size={12} /> : null}
                    </span>
                    <span>At least 1 numerical digit (0-9)</span>
                  </li>
                  <li className={rules.special ? "passed" : ""}>
                    <span className="check-icon">
                      {rules.special ? <FiCheck size={12} /> : null}
                    </span>
                    <span>At least 1 special character (!@#$%^&*...)</span>
                  </li>
                  <li className={passwordsMatch ? "passed" : ""}>
                    <span className="check-icon">
                      {passwordsMatch ? <FiCheck size={12} /> : null}
                    </span>
                    <span>Both passwords must match exactly</span>
                  </li>
                </ul>

                <div className="policy-footer-note">
                  <FiAlertCircle size={15} />
                  <span>
                    Changing your password triggers an immediate security alert to your registered Gmail.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: THEME COLOR PALETTE
      ======================================================== */}
      {activeTab === "appearance" && (
        <div className="settings-tab-content">
          {/* Color Palette Grid */}
          <div className="settings-card">
            <div className="settings-card-header">
              <FiDroplet size={18} className="card-header-icon" />
              <div>
                <h3>Accent Color Palettes</h3>
                <p className="card-subtitle">
                  Select your primary accent color. The entire application UI will automatically update.
                </p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="palette-grid">
                {palettes.map((p) => {
                  const isSelected = p.id === currentPaletteId;
                  return (
                    <div
                      key={p.id}
                      className={`palette-card ${isSelected ? "selected" : ""}`}
                      onClick={() => selectPalette(p.id)}
                    >
                      <div
                        className="palette-color-strip"
                        style={{
                          background: `linear-gradient(135deg, ${p.primary} 0%, ${p.primaryHover} 100%)`,
                        }}
                      >
                        {isSelected && (
                          <span className="palette-check-badge">
                            <FiCheck size={14} />
                          </span>
                        )}
                      </div>

                      <div className="palette-card-body">
                        <div className="palette-swatch-row">
                          <span
                            className="palette-swatch-circle"
                            style={{ backgroundColor: p.primary }}
                          />
                          <span className="palette-name">{p.name}</span>
                        </div>
                        <span className="palette-tagline">{p.tagline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="settings-card">
            <div className="settings-card-header">
              <FiLayers size={18} className="card-header-icon" />
              <div>
                <h3>Live UI Palette Preview</h3>
                <p className="card-subtitle">
                  Preview how buttons, indicators, and highlights look in "{activePalette.name}"
                </p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="preview-box-container">
                <div className="preview-item">
                  <span className="preview-label">Primary Button</span>
                  <button type="button" className="btn-preview-primary">
                    <FiCheck size={15} /> Primary Action
                  </button>
                </div>

                <div className="preview-item">
                  <span className="preview-label">Secondary / Outline</span>
                  <button type="button" className="btn-preview-outline">
                    View Details
                  </button>
                </div>

                <div className="preview-item">
                  <span className="preview-label">Status Badge</span>
                  <span className="preview-badge-pill">Super Admin</span>
                </div>

                <div className="preview-item">
                  <span className="preview-label">Active Sidebar Link</span>
                  <div className="preview-sidebar-item">
                    <FiLayers size={16} />
                    <span>Dashboard</span>
                  </div>
                </div>
              </div>

              <div className="preview-reset-row">
                <button
                  type="button"
                  className="btn-reset-theme"
                  onClick={() => selectPalette("orange")}
                >
                  <FiRefreshCw size={14} /> Reset to Institutional Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;
