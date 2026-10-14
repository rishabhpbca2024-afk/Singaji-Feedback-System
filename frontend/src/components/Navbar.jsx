import { useNavigate } from "react-router-dom";
import { FiSettings, FiShield, FiMenu, FiX } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import { useSidebar } from "../context/SidebarContext.jsx";
import "./Navbar.css";
import ssecLogo from "../assets/rename.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "Admin";
  const isFaculty = user?.role === "Faculty";

  // Clean, non-redundant display names
  const displayName = isAdmin
    ? (!user?.name || user.name.toLowerCase() === "admin" ? "Administrator" : user.name)
    : (user?.name || "Faculty Member");

  const displayRole = isAdmin ? "Super Admin" : (user?.role || "Faculty");

  const handleProfileClick = () => {
    if (isAdmin) {
      navigate("/admin/settings");
    } else if (isFaculty) {
      navigate("/faculty/profile");
    }
  };

  return (
    <header className="navbar">
      {/* Left Side — Toggle button & Brand */}
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-toggle-btn"
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        <div
          className="navbar-brand"
          onClick={toggleSidebar}
          style={{ cursor: "pointer" }}
          title="Toggle sidebar"
        >
          <img
            src={ssecLogo}
            alt="Singaji Educational Society"
            className="navbar-logo"
          />

          <div className="navbar-brand-text">
            <h1>Singaji Educational Society</h1>
            <p>Feedback Management System</p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        {/* User Profile Pill — Clickable to open Settings/Profile */}
        <div
          className="navbar-user-chip"
          onClick={handleProfileClick}
          title={isAdmin ? "Open Admin Settings & Profile" : "View Profile"}
        >
          <div className="navbar-avatar">
            {isAdmin ? (
              <FiShield className="avatar-shield-icon" size={16} />
            ) : (
              <span className="avatar-initial">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="navbar-user-info">
            <span className="navbar-user-name">{displayName}</span>
            <span className="navbar-user-role">{displayRole}</span>
          </div>

          {isAdmin && (
            <span className="navbar-settings-indicator" title="Settings">
              <FiSettings size={14} />
            </span>
          )}
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className="navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;