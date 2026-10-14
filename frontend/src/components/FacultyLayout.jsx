import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import FacultySidebar from "./FacultySidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider, useSidebar } from "../context/SidebarContext.jsx";
import "./Layout.css";

function FacultyLayoutContent() {
  const { sidebarOpen, closeSidebar } = useSidebar();
  const location = useLocation();

  // Auto-close sidebar on mobile screen when navigating to a new route
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      closeSidebar();
    }
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <Navbar />

      <div className="app-body">
        {/* Mobile Backdrop Overlay */}
        <div
          className={`sidebar-mobile-backdrop ${sidebarOpen ? "active" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        <FacultySidebar />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function FacultyLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent non-Faculty users from accessing Faculty portal layout
  if (user.role !== "Faculty") {
    return <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/login"} replace />;
  }

  return (
    <SidebarProvider>
      <FacultyLayoutContent />
    </SidebarProvider>
  );
}

export default FacultyLayout;
