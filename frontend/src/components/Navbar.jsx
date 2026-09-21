import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiKey } from "react-icons/fi";
import useAuth from "../hooks/useAuth.js";
import { useSidebar } from "../context/SidebarContext.jsx";
import AdminChangePasswordModal from "./AdminChangePasswordModal.jsx";
import "./Navbar.css";
import ssecLogo from "../assets/rename.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      {/* Left Side — Logo toggles sidebar */}
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

      {/* Right Side */}
      <div className="navbar-right">
        <div className="navbar-user">
          <span className="navbar-user-name">
            {user?.name || "Admin"}
          </span>

          <span className="navbar-user-role">
            {user?.role || "Administrator"}
          </span>
        </div>

        {/* Simple Change Password option for Admin */}
        {user?.role === "Admin" && (
          <button
            type="button"
            className="navbar-change-pwd"
            onClick={() => setIsAdminPasswordModalOpen(true)}
            title="Change Admin Password"
          >
            <FiKey size={14} />
            <span>Change Password</span>
          </button>
        )}

        <button
          className="navbar-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Admin Change Password Modal */}
      {user?.role === "Admin" && (
        <AdminChangePasswordModal
          isOpen={isAdminPasswordModalOpen}
          onClose={() => setIsAdminPasswordModalOpen(false)}
        />
      )}
    </header>
  );
}

export default Navbar;