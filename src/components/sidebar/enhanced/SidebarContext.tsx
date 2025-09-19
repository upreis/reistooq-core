import { createContext, useContext, ReactNode } from 'react';
import { SidebarContextValue } from './types/sidebar.types';
import { useSidebarState } from './hooks/useSidebarState';
import { SIDEBAR_CONFIG } from '@/config/enhanced-nav';

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const { state, config, actions, utils } = useSidebarState(SIDEBAR_CONFIG);

  const value: SidebarContextValue = {
    state,
    config,
    actions,
    utils
  };

  return (
    <SidebarContext.Provider value={value}>
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