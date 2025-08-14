import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AnnouncementProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AnnouncementTicker />
          <AppHeader />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
        <ThemeCustomizer />
      </div>
    </AnnouncementProvider>
  );
}