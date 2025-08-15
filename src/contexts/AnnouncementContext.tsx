import { createContext, useContext, useState, ReactNode } from "react";

interface AnnouncementContextType {
  isHidden: boolean;
  setIsHidden: (hidden: boolean) => void;
  hasAnnouncements: boolean;
  setHasAnnouncements: (has: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

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
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
}