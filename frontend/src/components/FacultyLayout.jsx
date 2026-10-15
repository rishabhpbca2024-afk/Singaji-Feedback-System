import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import FacultySidebar from "./FacultySidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider, useSidebar } from "../context/SidebarContext.jsx";
import "./Layout.css";

function FacultyLayoutContent() {
  const { sidebarOpen, closeSidebar } = useSidebar();

  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-body">
        <FacultySidebar />
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

function FacultyLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <FacultyLayoutContent />
    </SidebarProvider>
  );
}

export default FacultyLayout;

