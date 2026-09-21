import { useState } from "react";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiCheck,
  FiX,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import "./ChangePasswordModal.css";

const API_URL = import.meta.env.VITE_API_URL;

function ChangePasswordModal({ isOpen, onClose, onSuccess, isForced = false }) {
  const { updateUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Real-time validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.trim() !== "" &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!isFormValid) {
      if (!passwordsMatch) {
        setError("New passwords do not match.");
      } else {
        setError("Please ensure your new password satisfies all security requirements.");
      }
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current temporary password.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/api/faculty/change-password`, {
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
        setError(data.message || "Failed to change password. Please verify current password.");
        return;
      }

      setSuccess("Password changed successfully! Your account is now secured.");

      // Update user context so mustChangePassword becomes false
      if (updateUser) {
        updateUser({ mustChangePassword: false });
      }

      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error("Change password error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cp-modal-overlay">
      <div className="cp-modal-card">
        {/* Header */}
        <div className="cp-modal-header">
          <div className="cp-header-title-box">
            <div className="cp-icon-circle">
              <FiShield size={20} />
            </div>
            <div>
              <h2>Change Password</h2>
              <p>Set a new, secure password for your faculty account</p>
            </div>
          </div>
          {!isForced && (
            <button
              type="button"
              className="cp-close-btn"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>

        {/* Forced notice banner if initial password change */}
        {isForced && (
          <div className="cp-forced-banner">
            <FiAlertCircle size={18} className="cp-forced-icon" />
            <div>
              <strong>Action Required:</strong> You are logged in with the institutional default password. You must change your password before continuing.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="cp-form">
          {error && (
            <div className="cp-alert cp-alert-error">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="cp-alert cp-alert-success">
              <FiCheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="cp-field-group">
            <label htmlFor="cp-current">
              Current / Temporary Password <span className="cp-req">*</span>
            </label>
            <div className="cp-input-wrap">
              <FiLock className="cp-input-icon" />
              <input
                id="cp-current"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex="-1"
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="cp-field-group">
            <label htmlFor="cp-new">
              New Password <span className="cp-req">*</span>
            </label>
            <div className="cp-input-wrap">
              <FiLock className="cp-input-icon" />
              <input
                id="cp-new"
                type={showNew ? "text" : "password"}
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex="-1"
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="cp-field-group">
            <label htmlFor="cp-confirm">
              Confirm New Password <span className="cp-req">*</span>
            </label>
            <div className="cp-input-wrap">
              <FiLock className="cp-input-icon" />
              <input
                id="cp-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Password Requirements Checklist */}
          <div className="cp-checklist-box">
            <span className="cp-checklist-title">Password Requirements:</span>
            <div className="cp-checklist-grid">
              <div className={`cp-check-item ${hasMinLength ? "valid" : ""}`}>
                {hasMinLength ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>At least 8 characters</span>
              </div>
              <div className={`cp-check-item ${hasUppercase ? "valid" : ""}`}>
                {hasUppercase ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`cp-check-item ${hasLowercase ? "valid" : ""}`}>
                {hasLowercase ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className={`cp-check-item ${hasNumber ? "valid" : ""}`}>
                {hasNumber ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>At least one number (0-9)</span>
              </div>
              <div className={`cp-check-item ${hasSpecial ? "valid" : ""}`}>
                {hasSpecial ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>At least one special character (!@#$%...)</span>
              </div>
              <div className={`cp-check-item ${passwordsMatch ? "valid" : ""}`}>
                {passwordsMatch ? <FiCheck size={14} /> : <FiX size={14} />}
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="cp-actions">
            {!isForced && (
              <button
                type="button"
                className="cp-btn-cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="cp-btn-submit"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <span className="cp-btn-loading">
                  <span className="cp-spinner"></span>
                  Updating Password...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePasswordModal;
