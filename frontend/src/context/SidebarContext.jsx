import React, { createContext, useState, useEffect, useContext } from 'react';

export const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Check if screen is mobile on initial load
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });

  // Automatically update on window resize if crossing the 768px breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // If resized down to mobile, default to closed
        setSidebarOpen(false);
      } else {
        // If resized up to desktop, open
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar, closeSidebar, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

