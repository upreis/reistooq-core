import * as React from "react";

type SidebarUIState = {
  isSidebarCollapsed: boolean;          // desktop
  setIsSidebarCollapsed: (v: boolean) => void;
  isMobileSidebarOpen: boolean;         // mobile
  setIsMobileSidebarOpen: (v: boolean) => void;
};

const SidebarUIContext = React.createContext<SidebarUIState | null>(null);
const LS_KEY = "ui.sidebar.collapsed";

export function SidebarUIProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw === "true";
    } catch { return false; }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    try { localStorage.setItem(LS_KEY, String(isSidebarCollapsed)); } catch {}
  }, [isSidebarCollapsed]);

  const value = React.useMemo(() => ({
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  }), [isSidebarCollapsed, isMobileSidebarOpen]);

  return <SidebarUIContext.Provider value={value}>{children}</SidebarUIContext.Provider>;
}

export function useSidebarUI() {
  const ctx = React.useContext(SidebarUIContext);
  if (!ctx) throw new Error("useSidebarUI must be used within SidebarUIProvider");
  return ctx;
}