import { useState, useEffect } from "react";
import { Megaphone, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  startDate?: string;
  endDate?: string;
}

// Mock data - in real app this would come from your state management/API
const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    message: "🎉 Nova funcionalidade: Scanner de código de barras disponível!",
    type: "success",
    active: true
  },
  {
    id: "2", 
    message: "⚠️ Manutenção programada hoje às 02:00 - Sistema ficará indisponível por 30 minutos",
    type: "warning",
    active: true
  },
  {
    id: "3",
    message: "📢 Integração com Tiny ERP configurada com sucesso - Sincronização automática ativa",
    type: "info", 
    active: true
  }
];

export function AnnouncementTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [announcements] = useState(mockAnnouncements.filter(a => a.active));
  
  useEffect(() => {
    if (announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'success':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  return (
    <div className={cn(
      "w-full border-b transition-all duration-300 ease-in-out",
      getTypeStyles(currentAnnouncement.type),
      isCollapsed && "h-10"
    )}>
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {!isCollapsed && (
          <div className="flex items-center gap-3 flex-1">
            <Megaphone className="h-4 w-4 flex-shrink-0" />
            
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium animate-in slide-in-from-right-2 duration-300">
                {currentAnnouncement.message}
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <Megaphone className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {announcements.length} anúncio{announcements.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 ml-4">
          {!isCollapsed && announcements.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevAnnouncement}
                className="h-6 w-6 p-0 hover:bg-white/10"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              
              <span className="text-xs opacity-70 min-w-[3rem] text-center">
                {currentIndex + 1} / {announcements.length}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextAnnouncement}
                className="h-6 w-6 p-0 hover:bg-white/10"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 hover:bg-white/10"
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}