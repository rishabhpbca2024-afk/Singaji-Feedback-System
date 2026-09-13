import { Outlet, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import useAuth from "../hooks/useAuth.js";
import { SidebarProvider } from "../context/SidebarContext.jsx";
import "./Layout.css";

function Layout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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