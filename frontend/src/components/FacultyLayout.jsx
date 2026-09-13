import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import FacultySidebar from "./FacultySidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import "./Layout.css";

function FacultyLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
