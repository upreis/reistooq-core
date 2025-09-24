import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import AppMobileHeader from "@/components/layout/AppMobileHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { cn } from "@/lib/utils";

interface MobileAppShellProps {
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
  showBottomNav?: boolean;
}

export function MobileAppShell({ 
  title, 
  children, 
  headerActions, 
  breadcrumb,
  className,
  showBottomNav = true 
}: MobileAppShellProps) {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Mobile Header */}
      <AppMobileHeader title={title} actions={headerActions} breadcrumb={breadcrumb} />
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 min-w-0 overflow-x-hidden",
        "p-3",
        showBottomNav ? "pb-20" : "pb-3"
      )}>
        {children}
      </main>
      
      {/* Bottom Navigation */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}