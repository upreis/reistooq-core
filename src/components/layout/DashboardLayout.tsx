import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider } from "@/contexts/AnnouncementContext";
import { SystemBanner } from "@/components/system/SystemBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const systemNotices = [
    // Environment-based notice
    ...(import.meta.env.VITE_BANNER_MESSAGE
      ? [{
          id: "env-banner",
          tone: (import.meta.env.VITE_BANNER_TONE as any) ?? "warning",
          message: String(import.meta.env.VITE_BANNER_MESSAGE),
          title: import.meta.env.VITE_BANNER_TITLE || undefined,
          ttlHours: 24,
        }]
      : []),
    // Default example notice
    ...(!import.meta.env.VITE_BANNER_MESSAGE ? [{
      id: "maint-2025-08-15",
      tone: "warning" as const,
      title: "Manutenção programada hoje às 02:00",
      message: "Sistema ficará indisponível por 30 minutos",
      ttlHours: 24
    }] : [])
  ];

  return (
    <AnnouncementProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AnnouncementTicker />
          <AppHeader />
          <SystemBanner notices={systemNotices} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AnnouncementProvider>
  );
}