import useAuth from "../hooks/useAuth.js";
import "./FacultyProfile.css";
const API_URL = import.meta.env.VITE_API_URL;


function FacultyProfile() {
  const { user } = useAuth();

  return (
    <div className="faculty-profile-page">
      {/* Page Header */}
      <div className="profile-page-header">
        <div>
          <h1>Faculty Profile</h1>
          <p>View your academic and account information</p>
        </div>
      </div>

      <div className="profile-card-grid">
        {/* Left Column */}
        <div className="profile-sidebar-card">
          <div className="profile-avatar">
            <span>
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "F"}
            </span>
          </div>

          <h2>{user?.name || "Faculty"}</h2>

          <p className="profile-desig">
            Faculty
          </p>

          <span className="profile-dept-badge">
            {user?.department || "Department"}
          </span>

          <div className="profile-meta-list">
            <div className="meta-item">
              <span className="meta-label">
                Department
              </span>

              <strong className="meta-value">
                {user?.department || "-"}
              </strong>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className="profile-details-card">
          <h3>Faculty Information</h3>

          <div className="profile-details-grid">
            {/* Name */}
            <div className="detail-box">
              <span className="detail-label">
                Full Name
              </span>

              <strong className="detail-val">
                {user?.name || "-"}
              </strong>
            </div>

            {/* Gmail */}
            <div className="detail-box">
              <span className="detail-label">
                Gmail
              </span>

              <strong className="detail-val">
                {user?.email || user?.gmail || "-"}
              </strong>
            </div>

            {/* Department */}
            <div className="detail-box">
              <span className="detail-label">
                Department
              </span>

              <strong className="detail-val">
                {user?.department || "-"}
              </strong>
            </div>

            {/* Subjects */}
            <div className="detail-box">
              <span className="detail-label">
                Subjects
              </span>

              <strong className="detail-val">
                {user?.subjects?.length
                  ? user.subjects.join(", ")
                  : "-"}
              </strong>
            </div>

            {/* Role */}
            <div className="detail-box">
              <span className="detail-label">
                Role
              </span>

              <strong className="detail-val">
                {user?.role || "Faculty"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyProfile;