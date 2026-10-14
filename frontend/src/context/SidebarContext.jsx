import React, { createContext, useState, useContext, useEffect } from 'react';

export const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });

  const toggleSidebar = () => {
    // On laptop/desktop (> 768px), sidebar is permanently open and should not toggle
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setSidebarOpen(true);
      return;
    }
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    // On laptop/desktop (> 768px), sidebar cannot be closed
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setSidebarOpen(true);
      return;
    }
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  // Ensure sidebar is always open when resizing to desktop/laptop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
