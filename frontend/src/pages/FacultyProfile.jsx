import { useState } from "react";
import { FiLock, FiKey, FiCheckCircle, FiShield, FiAlertTriangle } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";
import "./FacultyProfile.css";

function FacultyProfile() {
  const { user } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handlePasswordSuccess = () => {
    setToastMessage("Password changed successfully! Your account is now secured.");
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  return (
    <div className="faculty-profile-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="profile-toast">
          <FiCheckCircle size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h1>Faculty Profile</h1>
          <p>View your academic and account information</p>
        </div>

        <button
          type="button"
          className="btn-change-password-header"
          onClick={() => setIsChangePasswordOpen(true)}
        >
          <FiKey size={16} />
          Change Password
        </button>
      </div>

      {/* Mandatory password change alert banner if temporary password is still active */}
      {user?.mustChangePassword && (
        <div className="profile-warning-banner">
          <FiAlertTriangle size={20} className="banner-icon" />
          <div className="banner-text">
            <strong>Temporary Password in Use:</strong> You are currently using the institutional default password. Please change your password to protect your account.
          </div>
          <button
            type="button"
            className="btn-banner-action"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Change Now
          </button>
        </div>
      )}

      <div className="profile-card-grid">
        {/* Left Column */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar">
            <span>
              {user?.name ? user.name.charAt(0).toUpperCase() : "F"}
            </span>
          </div>

          <h2>{user?.name || "Faculty"}</h2>

          <p className="profile-desig">Faculty</p>

          <span className="profile-dept-badge">
            {user?.department || "Department"}
          </span>

          <div className="profile-meta-list">
            <div className="meta-item">
              <span className="meta-label">Faculty ID</span>
              <strong className="meta-value">
                {user?.facultyId || "-"}
              </strong>
            </div>

            <div className="meta-item">
              <span className="meta-label">Department</span>
              <strong className="meta-value">
                {user?.department || "-"}
              </strong>
            </div>

            <div className="meta-item">
              <span className="meta-label">Status</span>
              <strong className="meta-value" style={{ color: "#16a34a" }}>
                Active
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-right-column">
          {/* Faculty Information Card */}
          <div className="profile-details-card">
            <h3>Faculty Information</h3>

            <div className="profile-details-grid">
              {/* Name */}
              <div className="detail-box">
                <span className="detail-label">Full Name</span>
                <strong className="detail-val">{user?.name || "-"}</strong>
              </div>

              {/* Gmail */}
              <div className="detail-box">
                <span className="detail-label">Gmail / Institutional Email</span>
                <strong className="detail-val">
                  {user?.email || user?.gmail || "-"}
                </strong>
              </div>

              {/* Department */}
              <div className="detail-box">
                <span className="detail-label">Department / Section</span>
                <strong className="detail-val">{user?.department || "-"}</strong>
              </div>

              {/* Subjects */}
              <div className="detail-box">
                <span className="detail-label">Assigned Subjects</span>
                <strong className="detail-val">
                  {user?.subjects?.length ? user.subjects.join(", ") : "-"}
                </strong>
              </div>

              {/* Role */}
              <div className="detail-box">
                <span className="detail-label">System Role</span>
                <strong className="detail-val">{user?.role || "Faculty"}</strong>
              </div>
            </div>
          </div>

          {/* Security & Password Card */}
          <div className="profile-security-card">
            <div className="security-card-header">
              <div className="security-title-box">
                <FiShield size={20} className="security-icon" />
                <div>
                  <h3>Account Security & Password</h3>
                  <p>Manage your password and secure your institutional portal account</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-security-change"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <FiLock size={15} />
                Change Password
              </button>
            </div>

            <div className="security-status-row">
              <div className="status-label-group">
                <span className="status-title">Password Status:</span>
                {user?.mustChangePassword ? (
                  <span className="badge-warning">Temporary Password Active</span>
                ) : (
                  <span className="badge-success">Personal Password Configured</span>
                )}
              </div>
              <p className="status-hint">
                Password must be at least 8 characters long with uppercase, lowercase, numbers, and special characters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={handlePasswordSuccess}
        isForced={Boolean(user?.mustChangePassword)}
      />
    </div>
  );
}

export default FacultyProfile;