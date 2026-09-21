import { useState } from "react";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiKey,
} from "react-icons/fi";
import "./AdminChangePasswordModal.css";

const API_URL = import.meta.env.VITE_API_URL;

function AdminChangePasswordModal({ isOpen, onClose, onSuccess }) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setIsLoading(true);

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
        setError(data.message || "Failed to update password. Please check current password.");
        return;
      }

      setSuccess("Admin password changed successfully!");

      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess("");
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error("Admin change password error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <div className="admin-cp-overlay" onClick={handleClose}>
      <div className="admin-cp-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-cp-header">
          <div className="admin-cp-title-box">
            <div className="admin-cp-icon">
              <FiKey size={20} />
            </div>
            <div>
              <h2>Change Admin Password</h2>
              <p>Update your administrator account password</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-cp-close"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-cp-form">
          {error && (
            <div className="admin-cp-alert alert-error">
              <FiAlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="admin-cp-alert alert-success">
              <FiCheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="admin-cp-field">
            <label htmlFor="admin-curr-pwd">Current Password</label>
            <div className="admin-cp-input-wrap">
              <FiLock className="admin-cp-field-icon" />
              <input
                id="admin-curr-pwd"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="admin-cp-eye"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex="-1"
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="admin-cp-field">
            <label htmlFor="admin-new-pwd">New Password</label>
            <div className="admin-cp-input-wrap">
              <FiLock className="admin-cp-field-icon" />
              <input
                id="admin-new-pwd"
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="admin-cp-eye"
                onClick={() => setShowNew(!showNew)}
                tabIndex="-1"
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="admin-cp-field">
            <label htmlFor="admin-conf-pwd">Confirm New Password</label>
            <div className="admin-cp-input-wrap">
              <FiLock className="admin-cp-field-icon" />
              <input
                id="admin-conf-pwd"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="admin-cp-eye"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="admin-cp-actions">
            <button
              type="button"
              className="admin-cp-btn-cancel"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-cp-btn-submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminChangePasswordModal;
