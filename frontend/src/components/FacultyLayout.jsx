import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import FacultySidebar from "./FacultySidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import "./Layout.css";

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
      <div className="app-layout">
        <Navbar />
        <div className="app-body">
          <FacultySidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default FacultyLayout;
