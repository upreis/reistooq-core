import { createContext, useContext, useState, ReactNode } from "react";

interface AnnouncementContextType {
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
  hasAnnouncements: boolean;
  setHasAnnouncements: (has: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

// CRÍTICO: Default value seguro
const defaultAnnouncementValue: AnnouncementContextType = {
  isHidden: false,
  setIsHidden: () => {},
  hasAnnouncements: false,
  setHasAnnouncements: () => {},
  isCollapsed: false,
  setIsCollapsed: () => {}
};

const AnnouncementContext = createContext<AnnouncementContextType>(defaultAnnouncementValue);

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [hasAnnouncements, setHasAnnouncements] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AnnouncementContext.Provider value={{
      isHidden,
      setIsHidden,
      hasAnnouncements,
      setHasAnnouncements,
      isCollapsed,
      setIsCollapsed
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  
  // CRÍTICO: Fallback ao invés de erro
  if (!context || context === defaultAnnouncementValue) {
    console.warn('useAnnouncements usado fora do AnnouncementProvider - usando fallback seguro');
    return defaultAnnouncementValue;
  }
  
  return context;
}