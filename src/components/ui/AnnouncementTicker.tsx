import { useState, useEffect, useMemo } from "react";
import { Megaphone, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { useAnnouncements } from "@/contexts/AnnouncementContext";
import { useSidebarUI } from "@/context/SidebarUIContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSystemAlerts } from '@/features/admin/hooks/useAdmin';
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  href?: string;
  link_label?: string;
  startDate?: string;
  endDate?: string;
}

// Avisos carregados do banco (system_alerts)

// Normalização de rotas e aliases para compatibilidade com rotas antigas
const routeAliases: Record<string, string[]> = {
  '/vendas': ['/oms'],
  '/oms': ['/vendas'],
  '/ecommerce/loja': ['/apps/ecommerce/shop'],
  '/apps/ecommerce/shop': ['/ecommerce/loja'],
  '/ecommerce/detalhes': ['/apps/ecommerce/detail'],
  '/apps/ecommerce/detail': ['/ecommerce/detalhes'],
  '/produtos': ['/apps/ecommerce/list'],
  '/apps/ecommerce/list': ['/produtos'],
  '/ecommerce/checkout': ['/apps/ecommerce/checkout'],
  '/produtos/adicionar': ['/apps/ecommerce/addproduct'],
  '/apps/ecommerce/addproduct': ['/produtos/adicionar'],
  '/produtos/editar': ['/apps/ecommerce/editproduct'],
  '/apps/ecommerce/editproduct': ['/produtos/editar'],
  '/calendario': ['/apps/calendar'],
  '/apps/calendar': ['/calendario'],
  '/notas': ['/apps/notes'],
  '/apps/notes': ['/notas'],
  '/integracoes': ['/configuracoes/integracoes'],
  '/configuracoes/integracoes': ['/integracoes'],
  '/dashboard': ['/']
};

const normalizePath = (p: string) => (p || '').replace(/\/+$/, '');

const routeMatches = (current: string, target: string) => {
  const c = normalizePath(current);
  const t = normalizePath(target);
  if (!t) return true;
  if (c.startsWith(t)) return true;
  const aliasForTarget = routeAliases[t] || [];
  if (aliasForTarget.some(a => c.startsWith(normalizePath(a)))) return true;
  // Também checa se a rota atual possui um alias que começa com o alvo
  const aliasForCurrent = routeAliases[c] || [];
  if (aliasForCurrent.some(a => normalizePath(a).startsWith(t))) return true;
  return false;
};
export function AnnouncementTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const { isHidden, setIsHidden, setHasAnnouncements, isCollapsed, setIsCollapsed } = useAnnouncements();
  const { isSidebarCollapsed } = useSidebarUI();
  const isMobile = useIsMobile();
  const { alerts, dismissAlert } = useSystemAlerts();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Carregar alertas dispensados pelo usuário para não exibi-los novamente
  useEffect(() => {
    const loadDismissed = async () => {
      const { data, error } = await supabase
        .from('user_dismissed_notifications')
        .select('notification_id')
        .eq('notification_type', 'system_alert');
      if (!error && data) {
        setDismissedAlerts(new Set((data as any[]).map((d) => d.notification_id)));
      }
    };
    loadDismissed();
  }, []);

  const announcements = useMemo<Announcement[]>(() => {
    const currentRoute = location.pathname;
    
    return alerts
      .filter((a: any) => {
        // Filtros básicos
        if (!a.active || (a.expires_at && new Date(a.expires_at) < new Date())) {
          return false;
        }
        
        // Se o alerta foi dispensado pelo usuário
        if (dismissedAlerts.has(a.id)) {
          return false;
        }
        
        // Filtrar por rota se especificado
        if (a.target_routes && a.target_routes.length > 0) {
          return a.target_routes.some((route: string) => routeMatches(currentRoute, route));
        }
        
        return true;
      })
      .map((a: any) => ({ 
        id: a.id, 
        message: a.message, 
        type: (a.kind as any), 
        active: true,
        href: a.href,
        link_label: a.link_label
      }));
  }, [alerts, dismissedAlerts, location.pathname]);
  
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

  if (isHidden || announcements.length === 0 || isCollapsed) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  // Announcement banner styling
  const getAnnouncementStyle = () => {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-200';
  };

  const nextAnnouncement = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const prevAnnouncement = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId);
      setDismissedAlerts(prev => new Set([...prev, alertId]));
      
      // Se é o último alerta ou só tem um, ajustar índice
      if (announcements.length <= 1) {
        setCurrentIndex(0);
      } else if (currentIndex >= announcements.length - 1) {
        setCurrentIndex(0);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível dispensar o alerta",
        variant: "destructive"
      });
    }
  };

  const handleAlertClick = (announcement: Announcement) => {
    if (announcement.href) {
      if (announcement.href.startsWith('http')) {
        // URL externa
        window.open(announcement.href, '_blank');
      } else {
        // Rota interna
        navigate(announcement.href);
      }
    }
  };

  const leftOffset = isMobile ? 0 : (isSidebarCollapsed ? 72 : 288);
  return (
    <div className={cn(
      "fixed top-0 z-50 transition-all duration-300 ease-in-out h-12",
      getAnnouncementStyle()
    )} style={{ left: leftOffset, right: 0 }}>
      <div className="flex items-center justify-between px-3 py-2 h-full">
        <div className="flex items-center gap-3 flex-1">
          <Megaphone className="h-4 w-4 flex-shrink-0" strokeWidth={2.5} />
          
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium animate-in slide-in-from-right-2 duration-300 flex-1">
                {currentAnnouncement.message}
              </p>
              {currentAnnouncement.href && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlertClick(currentAnnouncement)}
                  className="h-6 px-2 hover:bg-amber-500/20 text-xs"
                >
                  {currentAnnouncement.link_label || 'Ver mais'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {announcements.length > 1 && (
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
             onClick={() => handleDismissAlert(currentAnnouncement.id)}
             className="h-6 w-6 p-0 hover:bg-amber-500/20"
             title="Dispensar este alerta"
           >
             <X className="h-3 w-3" strokeWidth={2.5} />
           </Button>
           
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsCollapsed(true)}
             className="h-6 w-6 p-0 hover:bg-amber-500/20"
             title="Recolher anúncios"
           >
             <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
           </Button>
        </div>
      </div>
    </div>
  );
}