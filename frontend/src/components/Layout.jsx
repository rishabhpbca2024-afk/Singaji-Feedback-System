import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import "./Layout.css";

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
      <div className="app-layout">

        <Navbar />

        <div className="app-body">

          <Sidebar />

          <main className="main-content">
            <Outlet />
          </main>

        </div>

      </div>
    </SidebarProvider>
  );
}

export default Layout;