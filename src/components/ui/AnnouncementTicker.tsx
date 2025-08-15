import { useState, useEffect } from "react";
import { Megaphone, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useAnnouncements } from "@/contexts/AnnouncementContext";

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
  const { isHidden, setIsHidden, setHasAnnouncements } = useAnnouncements();
  const [announcements] = useState(mockAnnouncements.filter(a => a.active));
  
  useEffect(() => {
    setHasAnnouncements(announcements.length > 0);
  }, [announcements.length, setHasAnnouncements]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (isHidden || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  // Usando o estilo do banner de debug
  const getDebugBannerStyle = () => {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-200';
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
      getDebugBannerStyle(),
      isCollapsed ? "h-10" : "h-auto"
    )}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-3 flex-1">
          <Megaphone className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
          
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium animate-in slide-in-from-right-2 duration-300">
                {currentAnnouncement.message}
              </p>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">
                {announcements.length} aviso{announcements.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!isCollapsed && announcements.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={prevAnnouncement}
                className="h-6 w-6 p-0 hover:bg-amber-500/20"
              >
                <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
              </Button>
              
              <span className="text-xs font-semibold min-w-[3rem] text-center">
                {currentIndex + 1} / {announcements.length}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextAnnouncement}
                className="h-6 w-6 p-0 hover:bg-amber-500/20"
              >
                <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
              </Button>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 hover:bg-amber-500/20"
            title={isCollapsed ? "Expandir anúncios" : "Recolher anúncios"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
            ) : (
              <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHidden(true)}
            className="h-6 w-6 p-0 hover:bg-amber-500/20"
            title="Ocultar anúncios"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
}