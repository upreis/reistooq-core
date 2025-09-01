import { useEffect } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LogisticEvent } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';

interface CalendarNotificationsConfig {
  events: LogisticEvent[];
  onCreateSystemAlert?: (alert: {
    message: string;
    kind: 'info' | 'warning' | 'error' | 'success';
    href?: string;
    link_label?: string;
    target_routes?: string[];
    notification_days_before?: number;
  }) => void;
}

export const useCalendarNotifications = ({ 
  events, 
  onCreateSystemAlert 
}: CalendarNotificationsConfig) => {
  const { toast } = useToast();

  useEffect(() => {
    if (events.length === 0) return;

    let hasChecked = false;
    
    const checkNotifications = () => {
      if (hasChecked) return;
      hasChecked = true;
      
      const today = new Date();
      const checkedToday = localStorage.getItem(`notifications-checked-${format(today, 'yyyy-MM-dd')}`);
      
      // Evitar múltiplas execuções no mesmo dia
      if (checkedToday) return;
      
      events.forEach(event => {
        if (!event.notification_days_before || event.reminder_sent) return;
        
        const eventDate = new Date(event.date);
        const daysUntilEvent = differenceInDays(eventDate, today);
        
        // Verificar se é hora de notificar
        if (daysUntilEvent === event.notification_days_before) {
          const formattedDate = format(eventDate, "dd 'de' MMMM", { locale: ptBR });
          
          // Determinar tipo de notificação baseado na prioridade e tipo
          let notificationType: 'info' | 'warning' | 'error' | 'success' = 'info';
          let message = '';
          
          if (event.priority === 'critical') {
            notificationType = 'error';
          } else if (event.priority === 'high') {
            notificationType = 'warning';
          }
          
          // Criar mensagem personalizada baseada no tipo de evento
          switch (event.type) {
            case 'delivery':
              message = `🚚 Entrega agendada para ${formattedDate}: ${event.title}`;
              if (event.customer) {
                message += ` (Cliente: ${event.customer})`;
              }
              break;
              
            case 'pickup':
              message = `📦 Coleta agendada para ${formattedDate}: ${event.title}`;
              if (event.location) {
                message += ` (Local: ${event.location})`;
              }
              break;
              
            case 'deadline':
              message = `⏰ Prazo se aproxima (${formattedDate}): ${event.title}`;
              notificationType = event.priority === 'critical' ? 'error' : 'warning';
              break;
              
            case 'transport':
              message = `🚛 Transporte agendado para ${formattedDate}: ${event.title}`;
              if (event.transport_company) {
                message += ` (${event.transport_company})`;
              }
              break;
              
            case 'meeting':
              message = `👥 Reunião agendada para ${formattedDate}: ${event.title}`;
              break;
              
            default:
              message = `📅 Evento agendado para ${formattedDate}: ${event.title}`;
          }
          
          // Adicionar horário se disponível
          if (event.time) {
            message += ` às ${event.time}`;
          }
          
          // Mostrar toast imediato
          toast({
            title: 'Lembrete de Evento',
            description: message,
            variant: notificationType === 'error' ? 'destructive' : 'default',
            duration: 8000
          });
          
          // Criar alerta do sistema para exibir no banner (integração com AnnouncementTicker)
          if (onCreateSystemAlert) {
            onCreateSystemAlert({
              message,
              kind: notificationType,
              href: '/apps/calendar',
              link_label: 'Ver Calendário',
              target_routes: ['/'], // Mostrar no dashboard também
              notification_days_before: 0 // Mostrar até o dia do evento
            });
          }
        }
        
        // Notificação urgente para eventos no dia
        if (daysUntilEvent === 0 && event.status === 'scheduled') {
          const urgentMessage = `🚨 HOJE: ${event.title}${event.time ? ` às ${event.time}` : ''}`;
          
          toast({
            title: 'Evento HOJE!',
            description: urgentMessage,
            variant: 'destructive',
            duration: 10000
          });
          
          if (onCreateSystemAlert) {
            onCreateSystemAlert({
              message: urgentMessage,
              kind: 'error',
              href: '/apps/calendar',
              link_label: 'Ver Detalhes',
              target_routes: ['/'],
              notification_days_before: 0
            });
          }
        }
        
        // Notificação para eventos atrasados
        if (daysUntilEvent < 0 && !['completed', 'cancelled'].includes(event.status)) {
          const overdueDays = Math.abs(daysUntilEvent);
          const overdueMessage = `❌ ATRASADO (${overdueDays} dia(s)): ${event.title}`;
          
          // Apenas uma notificação por dia para eventos atrasados
          const overdueKey = `overdue-${event.id}-${format(today, 'yyyy-MM-dd')}`;
          if (!localStorage.getItem(overdueKey)) {
            toast({
              title: 'Evento Atrasado',
              description: overdueMessage,
              variant: 'destructive',
              duration: 12000
            });
            
            localStorage.setItem(overdueKey, 'true');
            
            if (onCreateSystemAlert) {
              onCreateSystemAlert({
                message: overdueMessage,
                kind: 'error',
                href: '/apps/calendar',
                link_label: 'Resolver',
                target_routes: ['/'],
                notification_days_before: 0
              });
            }
          }
        }
      });

      // Marcar que as notificações foram verificadas hoje
      localStorage.setItem(`notifications-checked-${format(today, 'yyyy-MM-dd')}`, 'true');
    };

    // Execução inicial com debounce
    const initialTimeout = setTimeout(checkNotifications, 2000);
    
    // Configurar verificação periódica (a cada 2 horas)
    const interval = setInterval(() => {
      hasChecked = false;
      checkNotifications();
    }, 2 * 60 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [events.length]); // Apenas quando o número de eventos mudar

  // Função para marcar evento como notificado
  const markEventAsNotified = (eventId: string) => {
    // Esta função seria chamada após exibir a notificação
    // Para evitar spam de notificações do mesmo evento
    const key = `notified-${eventId}-${format(new Date(), 'yyyy-MM-dd')}`;
    localStorage.setItem(key, 'true');
  };

  // Função para verificar se evento já foi notificado hoje
  const wasEventNotifiedToday = (eventId: string) => {
    const key = `notified-${eventId}-${format(new Date(), 'yyyy-MM-dd')}`;
    return !!localStorage.getItem(key);
  };

  return {
    markEventAsNotified,
    wasEventNotifiedToday
  };
};