import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MaterialMSidebar } from "./MaterialMSidebar";
import { MaterialMTopbar } from "./MaterialMTopbar";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";

interface MaterialMLayoutProps {
  children?: React.ReactNode;
}

export function MaterialMLayout({ children }: MaterialMLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <MaterialMSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <MaterialMTopbar 
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-background">
          {/* Page Content */}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}