import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { EnhancedSidebar, SidebarProvider } from "@/components/sidebar/enhanced";
import { ENHANCED_NAV_ITEMS } from "@/config/enhanced-nav";
import Header from "./vertical/header/Header";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider, useAnnouncements } from "@/contexts/AnnouncementContext";
import { useLayoutSingleton } from "@/layouts/guards/LayoutSingleton";
import AppMobileHeader from "@/components/layout/AppMobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const offset = !isHidden && !isCollapsed ? "pt-12" : "";

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

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full overflow-x-hidden">
        {/* Mobile Header */}
        {isMobile && <AppMobileHeader title={getPageTitle()} />}
        
        {/* Desktop Layout */}
        {!isMobile && <AnnouncementTicker />}
        
        <div className={`flex w-full bg-background ${!isMobile ? offset : ""} min-h-screen`}>
          {/* Enhanced Sidebar - fixed position on desktop */}
          {!isMobile && (
            <div className="relative">
              <EnhancedSidebar 
                navItems={ENHANCED_NAV_ITEMS}
                isMobile={false}
                onMobileClose={() => {}}
                isCollapsed={isSidebarCollapsed}
              />
            </div>
          )}

          {/* Rail button when collapsed - desktop only */}
          {!isMobile && isSidebarCollapsed && <CollapsedReopenTab />}

          {/* Conteúdo com scroll independente */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Desktop Header */}
            {!isMobile && <Header />}
            
            <main className={`flex-1 overflow-x-hidden min-w-0 ${
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