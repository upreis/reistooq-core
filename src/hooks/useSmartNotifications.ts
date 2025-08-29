import { useEffect, useCallback } from 'react';
import { differenceInDays, differenceInHours, addDays, isAfter, isBefore } from 'date-fns';
import { LogisticEvent } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';

interface SmartNotificationConfig {
  events: LogisticEvent[];
  onCreateSystemAlert?: (alert: {
    message: string;
    kind: 'info' | 'warning' | 'error' | 'success';
    href?: string;
    link_label?: string;
    target_routes?: string[];
    auto_dismiss?: boolean;
    priority?: number;
  }) => void;
  onConflictDetected?: (conflicts: LogisticEvent[]) => void;
  onSuggestOptimization?: (suggestion: {
    type: 'route_optimization' | 'time_adjustment' | 'resource_allocation';
    message: string;
    events: LogisticEvent[];
  }) => void;
}

export const useSmartNotifications = ({ 
  events, 
  onCreateSystemAlert,
  onConflictDetected,
  onSuggestOptimization
}: SmartNotificationConfig) => {
  const { toast } = useToast();

  // Detector de padrões inteligente
  const analyzePatterns = useCallback(() => {
    const today = new Date();
    
    // 1. Detectar conflitos de horário
    const conflicts = events.filter(event => {
      if (!event.time || event.status === 'cancelled') return false;
      
      return events.some(otherEvent => 
        otherEvent.id !== event.id &&
        otherEvent.date === event.date &&
        otherEvent.time === event.time &&
        otherEvent.status !== 'cancelled'
      );
    });

    if (conflicts.length > 0 && onConflictDetected) {
      onConflictDetected(conflicts);
    }

    // 2. Sugerir otimizações de rota (eventos no mesmo dia/região)
    const eventsByDate = events.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {} as Record<string, LogisticEvent[]>);

    Object.entries(eventsByDate).forEach(([date, dayEvents]) => {
      if (dayEvents.length >= 3) {
        const sameLocationEvents = dayEvents.filter(event => 
          event.location && dayEvents.some(other => 
            other.id !== event.id && 
            other.location?.includes(event.location?.split(',')[0] || '')
          )
        );

        if (sameLocationEvents.length >= 2 && onSuggestOptimization) {
          onSuggestOptimization({
            type: 'route_optimization',
            message: `${sameLocationEvents.length} eventos na mesma região em ${date}. Considere otimizar a rota.`,
            events: sameLocationEvents
          });
        }
      }
    });

    // 3. Detectar possíveis atrasos baseado em histórico
    const deliveriesWithoutConfirmation = events.filter(event => {
      const eventDate = new Date(event.date);
      const hoursUntilEvent = differenceInHours(eventDate, today);
      
      return event.type === 'delivery' &&
             event.status === 'scheduled' &&
             hoursUntilEvent <= 24 &&
             hoursUntilEvent > 0;
    });

    deliveriesWithoutConfirmation.forEach(event => {
      if (onCreateSystemAlert) {
        onCreateSystemAlert({
          message: `⚠️ Entrega "${event.title}" em ${differenceInHours(new Date(event.date), today)}h sem confirmação`,
          kind: 'warning',
          href: '/apps/calendar',
          link_label: 'Confirmar',
          priority: 2
        });
      }
    });

  }, [events, onConflictDetected, onSuggestOptimization, onCreateSystemAlert]);

  // Notificações proativas inteligentes
  const sendSmartNotifications = useCallback(() => {
    const now = new Date();
    
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const daysUntil = differenceInDays(eventDate, now);
      const hoursUntil = differenceInHours(eventDate, now);

      // Notificação urgente para eventos críticos
      if (event.priority === 'critical' && daysUntil <= 1 && daysUntil >= 0) {
        const urgencyLevel = hoursUntil <= 4 ? 'error' : 'warning';
        
        if (onCreateSystemAlert) {
          onCreateSystemAlert({
            message: `🚨 CRÍTICO: "${event.title}" ${hoursUntil <= 0 ? 'AGORA' : `em ${Math.max(1, hoursUntil)}h`}`,
            kind: urgencyLevel,
            href: '/apps/calendar',
            link_label: 'Ver Detalhes',
            priority: 1,
            auto_dismiss: false
          });
        }
      }

      // Notificação de preparação para entregas
      if (event.type === 'delivery' && daysUntil === 1 && event.status === 'confirmed') {
        toast({
          title: '📦 Preparar Entrega',
          description: `Entrega "${event.title}" amanhã. Verificar produtos e documentação.`,
          duration: 8000
        });
      }

      // Lembrete de confirmação para transportadoras
      if (event.type === 'pickup' && daysUntil === 2 && event.status === 'scheduled') {
        if (onCreateSystemAlert) {
          onCreateSystemAlert({
            message: `📞 Confirmar coleta "${event.title}" com ${event.transport_company || 'transportadora'}`,
            kind: 'info',
            href: '/apps/calendar',
            link_label: 'Confirmar',
            priority: 3
          });
        }
      }
    });
  }, [events, toast, onCreateSystemAlert]);

  // Análise de performance e tendências
  const analyzePerformance = useCallback(() => {
    const lastMonth = addDays(new Date(), -30);
    const recentEvents = events.filter(event => 
      isAfter(new Date(event.date), lastMonth)
    );

    const completedEvents = recentEvents.filter(e => e.status === 'completed');
    const delayedEvents = recentEvents.filter(e => e.status === 'delayed');
    
    const delayRate = recentEvents.length > 0 ? (delayedEvents.length / recentEvents.length) * 100 : 0;

    if (delayRate > 20 && onCreateSystemAlert) {
      onCreateSystemAlert({
        message: `📊 Taxa de atraso: ${delayRate.toFixed(1)}%. Revisar processos logísticos.`,
        kind: 'warning',
        href: '/apps/calendar',
        link_label: 'Analisar',
        priority: 4
      });
    }
  }, [events, onCreateSystemAlert]);

  // Executar análises
  useEffect(() => {
    const interval = setInterval(() => {
      analyzePatterns();
      sendSmartNotifications();
      analyzePerformance();
    }, 30 * 60 * 1000); // A cada 30 minutos

    // Execução inicial
    analyzePatterns();
    sendSmartNotifications();

    return () => clearInterval(interval);
  }, [analyzePatterns, sendSmartNotifications, analyzePerformance]);

  return {
    analyzePatterns,
    sendSmartNotifications,
    analyzePerformance
  };
};