import { NavLink, useNavigate } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext.jsx";
import useAuth from "../hooks/useAuth.js";
import "./FacultySidebar.css";

// Professional SVG Vector Icons
const Icons = {
  Dashboard: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),

  Schedule: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),

  Feedback: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="14" y2="13" />
    </svg>
  ),

  Profile: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  Logout: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

function FacultySidebar() {
  const { sidebarOpen } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    {
      to: "/faculty/dashboard",
      icon: Icons.Dashboard,
      label: "Dashboard",
    },
    {
      to: "/faculty/schedule",
      icon: Icons.Schedule,
      label: "My Schedule",
    },
    {
      to: "/faculty/feedback",
      icon: Icons.Feedback,
      label: "Feedback",
    },
    {
      to: "/faculty/profile",
      icon: Icons.Profile,
      label: "Profile",
    },
  ];

  return (
    <aside
      className={`sidebar ${
        sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
      }`}
    >
      <nav className="sidebar-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " active" : ""}`
            }
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className="sidebar-icon">{item.icon}</span>

            <span className="sidebar-label">
              {item.label}
            </span>
          </NavLink>
        ))}

        {/* Separator */}
        <div className="sidebar-separator" />

        {/* Logout */}
        <button
          className="sidebar-link sidebar-logout-btn"
          onClick={handleLogout}
          title={!sidebarOpen ? "Logout" : undefined}
        >
          <span className="sidebar-icon">
            {Icons.Logout}
          </span>

          <span className="sidebar-label">
            Logout
          </span>
        </button>
      </nav>
    </aside>
  );
}

export default FacultySidebar;