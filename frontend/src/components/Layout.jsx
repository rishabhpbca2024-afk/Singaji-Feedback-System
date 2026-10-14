import { useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider, useSidebar } from "../context/SidebarContext.jsx";
import "./Layout.css";

function LayoutContent() {
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

        <Sidebar />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Layout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent non-Admin users from accessing Admin dashboard and settings
  if (user.role !== "Admin") {
    return <Navigate to={user.role === "Faculty" ? "/faculty/dashboard" : "/login"} replace />;
  }

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}

export default Layout;