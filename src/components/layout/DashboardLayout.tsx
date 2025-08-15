import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AnnouncementTicker } from "@/components/ui/AnnouncementTicker";
import { AnnouncementProvider, useAnnouncements } from "@/contexts/AnnouncementContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const InnerLayout = ({ children }: { children: React.ReactNode }) => {
  const { isHidden, isCollapsed } = useAnnouncements();
  const offset = !isHidden && !isCollapsed ? "pt-12" : ""; // aplica offset quando banner visível

  return (
    <>
      <AnnouncementTicker />
      <div className={`min-h-screen flex w-full bg-background ${offset}`}>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AnnouncementProvider>
      <InnerLayout>{children}</InnerLayout>
    </AnnouncementProvider>
  );
}
