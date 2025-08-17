import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { EnhancedSidebar, SidebarProvider } from "@/components/sidebar/enhanced";
import { ENHANCED_NAV_ITEMS } from "@/config/enhanced-nav";
import Header from "./vertical/header/Header";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider, useAnnouncements } from "@/contexts/AnnouncementContext";
import { useLayoutSingleton } from "@/layouts/guards/LayoutSingleton";

const CollapsedReopenTab: React.FC = () => {
  const { setIsSidebarCollapsed } = useSidebarUI();
  return (
    <div className="fixed left-0 top-16 hidden md:flex h-screen w-4 z-50 items-center justify-center" style={{ pointerEvents: 'none' }}>
      <button
        type="button"
        aria-label="Expandir menu"
        onClick={() => setIsSidebarCollapsed(false)}
        className="rounded-full border bg-background shadow p-1 hover:shadow-md focus:outline-none focus:ring"
        style={{ pointerEvents: 'auto' }}
        data-testid="sidebar-rail"
      >
        {/* chevron-right */}
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </button>
    </div>
  );
};

const InnerLayout = () => {
  const { isMobileSidebarOpen, setIsMobileSidebarOpen, isSidebarCollapsed } = useSidebarUI();
  const { isHidden, isCollapsed } = useAnnouncements();
  const location = useLocation();

  const offset = !isHidden && !isCollapsed ? "pt-12" : "";

  // Fechar drawer mobile ao trocar de rota
  useEffect(() => { setIsMobileSidebarOpen(false); }, [location.pathname, setIsMobileSidebarOpen]);

  return (
    <SidebarProvider>
      <AnnouncementTicker />
      <div className={`flex min-h-screen w-full bg-background ${offset}`}>
        {/* Enhanced Sidebar - integrated with SidebarUIProvider */}
        <EnhancedSidebar 
          navItems={ENHANCED_NAV_ITEMS}
          isMobile={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Overlay mobile - única instância */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 md:hidden z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Rail button when collapsed */}
        {isSidebarCollapsed && <CollapsedReopenTab />}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <main className="flex-1 min-h-0 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default function FullLayout() {
  const { ref, mode, key } = useLayoutSingleton("FullLayout");

  // Se este FullLayout estiver DENTRO de outro, não renderiza header/sidebar
  if (mode === "nested") {
    return (
      <div ref={ref} data-layout-root={key} className="min-h-screen">
        <Outlet />
      </div>
    );
  }

  // Instância primária (única) do layout
  return (
    <div ref={ref} data-layout-root={key}>
      <AnnouncementProvider>
        <InnerLayout />
      </AnnouncementProvider>
    </div>
  );
}