import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarUIContextType {
  // Desktop sidebar
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  // Mobile sidebar  
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  
  // Submenu state (unified)
  openGroups: Record<string, boolean>;
  toggleGroup: (groupId: string) => void;
  openGroup: (groupId: string) => void;
  closeGroup: (groupId: string) => void;
  isGroupOpen: (groupId: string) => boolean;
}

const SidebarUIContext = createContext<SidebarUIContextType | undefined>(undefined);

export function SidebarUIProvider({ children }: { children: ReactNode }) {
  // Desktop collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('ui.sidebar.collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  // Mobile open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Unified submenu state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('ui.sidebar.openGroups');
    return stored ? JSON.parse(stored) : {};
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('ui.sidebar.collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Persist open groups
  useEffect(() => {
    localStorage.setItem('ui.sidebar.openGroups', JSON.stringify(openGroups));
  }, [openGroups]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const toggleGroup = (groupId: string) => {
    console.log('SidebarUIContext toggleGroup called:', groupId);
    console.log('Previous state:', openGroups[groupId]);
    setOpenGroups(prev => {
      const newState = {
        ...prev,
        [groupId]: !prev[groupId]
      };
      console.log('New state for', groupId, ':', newState[groupId]);
      return newState;
    });
  };

  const openGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: true }));
  };

  const closeGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: false }));
  };

  const isGroupOpen = (groupId: string) => {
    return Boolean(openGroups[groupId]);
  };

  return (
    <SidebarUIContext.Provider value={{
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      toggleSidebar,
      isMobileSidebarOpen,
      setIsMobileSidebarOpen,
      openGroups,
      toggleGroup,
      openGroup,
      closeGroup,
      isGroupOpen
    }}>
      {children}
    </SidebarUIContext.Provider>
  );
}

export const useSidebarUI = () => {
  const context = useContext(SidebarUIContext);
  if (context === undefined) {
    throw new Error('useSidebarUI must be used within a SidebarUIProvider');
  }
  return context;
};