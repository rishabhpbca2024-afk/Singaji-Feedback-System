import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider, useSidebar } from "../context/SidebarContext.jsx";
import "./Layout.css";

function LayoutContent() {
  const { sidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <Sidebar />
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Layout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}

export default Layout;