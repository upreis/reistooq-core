import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { EnhancedSidebar } from "@/components/sidebar/enhanced";
import { ENHANCED_NAV_ITEMS } from "@/config/enhanced-nav";
import Header from "./vertical/header/Header";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider, useAnnouncements } from "@/contexts/AnnouncementContext";
import { useLayoutSingleton } from "@/layouts/guards/LayoutSingleton";
import AppMobileHeader from "@/components/layout/AppMobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { FloatingQuickAccessDock } from "@/components/sidebar/FloatingQuickAccessDock";

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
  const { isHidden, isCollapsed, hasAnnouncements } = useAnnouncements();
  const location = useLocation();
  const isMobile = useIsMobile();

  const offset = hasAnnouncements && !isHidden && !isCollapsed ? "pt-12" : "";

  // Fechar drawer mobile ao trocar de rota
  useEffect(() => { setIsMobileSidebarOpen(false); }, [location.pathname, setIsMobileSidebarOpen]);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/estoque") return "Estoque";
    if (path === "/pedidos") return "Pedidos";
    if (path === "/scanner") return "Scanner";
    if (path === "/historico") return "Histórico";
    if (path === "/config") return "Configurações";
    return "Sistema";
  };

  // Pages that use MobileAppShell (which already includes AppMobileHeader)
  const usesMobileAppShell = () => {
    const path = location.pathname;
    return path.startsWith("/estoque") || path.startsWith("/pedidos") || path.startsWith("/de-para");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Mobile Header - Only show for pages that don't use MobileAppShell */}
      {isMobile && !usesMobileAppShell() && <AppMobileHeader title={getPageTitle()} />}
        
        {/* Desktop Layout */}
        {!isMobile && (
          <div className={`${isSidebarCollapsed ? 'ml-[72px]' : 'ml-72'}`}>
            <AnnouncementTicker />
          </div>
        )}
        
        <div className={`w-full bg-background min-h-screen`}>
          {/* Enhanced Sidebar - agora será renderizada como fixed */}
          {!isMobile && (
            <EnhancedSidebar 
              navItems={ENHANCED_NAV_ITEMS}
              isMobile={false}
              onMobileClose={() => {}}
              isCollapsed={isSidebarCollapsed}
            />
          )}

          {/* Rail button when collapsed - desktop only */}
          {!isMobile && isSidebarCollapsed && <CollapsedReopenTab />}

          {/* Floating Quick Access Dock - desktop only */}
          {!isMobile && <FloatingQuickAccessDock isSidebarCollapsed={isSidebarCollapsed} />}

          {/* Conteúdo principal com margem para sidebar */}
          <div className={`flex flex-col min-w-0 min-h-screen ${
            !isMobile ? (isSidebarCollapsed ? 'ml-[72px]' : 'ml-72') : ''
          } ${!isMobile ? offset : ''}`}>
            {/* Desktop Header */}
            {!isMobile && <Header />}
            
            <main className={`flex-1 min-w-0 ${
              isMobile 
                ? "p-3 pb-20" // mobile padding + bottom nav space
                : "p-6" // desktop padding
            }`}>
              <div className="w-full min-w-0 overflow-x-hidden">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
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