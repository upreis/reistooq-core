import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebarUI } from "@/context/SidebarUIContext";
import Sidebar from "./vertical/sidebar/Sidebar";
import Header from "./vertical/header/Header";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider, useAnnouncements } from "@/contexts/AnnouncementContext";

const CollapsedReopenTab: React.FC = () => {
  const { setIsSidebarCollapsed } = useSidebarUI();
  return (
    <div className="fixed left-0 top-0 hidden md:flex h-screen w-4 z-40 items-center justify-center pointer-events-none">
      <button
        type="button"
        aria-label="Expandir menu"
        onClick={() => setIsSidebarCollapsed(false)}
        className="pointer-events-auto rounded-full border bg-background shadow p-1 hover:shadow-md focus:outline-none focus:ring"
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

  // Fechar drawer mobile com ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setIsMobileSidebarOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsMobileSidebarOpen]);

  return (
    <>
      <AnnouncementTicker />
      <div className={`flex min-h-screen w-full bg-background ${offset}`}>
        {/* Sidebar */}
        <Sidebar />

        {/* Overlay mobile */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 md:hidden z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Aba fixa para reabrir quando colapsado (desktop) */}
        {isSidebarCollapsed && <CollapsedReopenTab />}

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 flex flex-col">
          <Header />
          <main className="flex-1 min-h-0 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default function FullLayout() {
  return (
    <AnnouncementProvider>
      <InnerLayout />
    </AnnouncementProvider>
  );
}