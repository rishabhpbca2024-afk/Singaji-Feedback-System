import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { useSidebar } from "../context/SidebarContext.jsx";
import "./Navbar.css";
import ssecLogo from "../assets/rename.png";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleSidebar } = useSidebar();

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

        <button
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