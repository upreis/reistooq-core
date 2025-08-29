import { useState, useEffect, useMemo } from 'react';
import { addDays, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { LogisticEvent, CalendarFilters, CalendarMetrics } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock data para desenvolvimento - substituir por dados reais do Supabase
const mockEvents: LogisticEvent[] = [
  {
    id: '1',
    title: 'Entrega Cliente VIP - São Paulo',
    description: 'Entrega de produtos eletrônicos para cliente premium',
    type: 'delivery',
    status: 'scheduled',
    priority: 'high',
    date: '2025-08-30',
    time: '14:00',
    duration: 60,
    location: 'São Paulo, SP',
    customer: 'TechCorp LTDA',
    tracking_code: 'BR123456789',
    transport_company: 'Transportadora Express',
    created_at: '2025-08-28T10:00:00Z',
    updated_at: '2025-08-28T10:00:00Z',
    notification_days_before: 2
  },
  {
    id: '2',
    title: 'Coleta no Fornecedor - Campinas',
    description: 'Buscar novo lote de produtos',
    type: 'pickup',
    status: 'confirmed',
    priority: 'medium',
    date: '2025-08-31',
    time: '09:00',
    duration: 120,
    location: 'Campinas, SP',
    customer: 'Fornecedor ABC',
    created_at: '2025-08-27T15:00:00Z',
    updated_at: '2025-08-29T08:00:00Z',
    notification_days_before: 1
  },
  {
    id: '3',
    title: 'Prazo Final - Relatório Mensal',
    description: 'Entrega do relatório de vendas de agosto',
    type: 'deadline',
    status: 'scheduled',
    priority: 'critical',
    date: '2025-08-29',
    time: '18:00',
    created_at: '2025-08-25T10:00:00Z',
    updated_at: '2025-08-25T10:00:00Z',
    notification_days_before: 3
  }
];

export const useLogisticCalendar = () => {
  const [events, setEvents] = useState<LogisticEvent[]>(mockEvents);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CalendarFilters>({
    types: [],
    statuses: [],
    priorities: [],
    dateRange: {}
  });
  const { toast } = useToast();

  // Filtrar eventos baseado nos filtros aplicados
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por tipo
      if (filters.types.length > 0 && !filters.types.includes(event.type)) {
        return false;
      }

      // Filtro por status
      if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) {
        return false;
      }

      // Filtro por prioridade
      if (filters.priorities.length > 0 && !filters.priorities.includes(event.priority)) {
        return false;
      }

      // Filtro por data
      if (filters.dateRange.start || filters.dateRange.end) {
        const eventDate = new Date(event.date);
        if (filters.dateRange.start && filters.dateRange.end) {
          return isWithinInterval(eventDate, {
            start: startOfDay(filters.dateRange.start),
            end: endOfDay(filters.dateRange.end)
          });
        }
        if (filters.dateRange.start) {
          return eventDate >= startOfDay(filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          return eventDate <= endOfDay(filters.dateRange.end);
        }
      }

      return true;
    });
  }, [events, filters]);

  // Calcular métricas
  const metrics = useMemo<CalendarMetrics>(() => {
    const today = new Date();
    
    return {
      totalEvents: filteredEvents.length,
      pendingDeliveries: filteredEvents.filter(e => 
        e.type === 'delivery' && ['scheduled', 'confirmed'].includes(e.status)
      ).length,
      scheduledPickups: filteredEvents.filter(e => 
        e.type === 'pickup' && ['scheduled', 'confirmed'].includes(e.status)
      ).length,
      criticalEvents: filteredEvents.filter(e => e.priority === 'critical').length,
      overdueEvents: filteredEvents.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate < today && !['completed', 'cancelled'].includes(e.status);
      }).length
    };
  }, [filteredEvents]);

  // Obter eventos que precisam de notificação
  const getUpcomingNotifications = useMemo(() => {
    const today = new Date();
    
    return filteredEvents.filter(event => {
      if (!event.notification_days_before || event.reminder_sent) return false;
      
      const eventDate = new Date(event.date);
      const daysUntilEvent = differenceInDays(eventDate, today);
      
      return daysUntilEvent <= event.notification_days_before && daysUntilEvent >= 0;
    });
  }, [filteredEvents]);

  // Carregar eventos do banco de dados
  const loadEvents = async (startDate?: Date, endDate?: Date) => {
    setLoading(true);
    try {
      // TODO: Implementar consulta real ao Supabase
      // const { data, error } = await supabase
      //   .from('logistic_events')
      //   .select('*')
      //   .gte('date', startDate?.toISOString().split('T')[0])
      //   .lte('date', endDate?.toISOString().split('T')[0])
      //   .order('date', { ascending: true });

      // if (error) throw error;
      // setEvents(data || []);
      
      // Por enquanto, usar dados mock
      setEvents(mockEvents);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os eventos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar novo evento
  const createEvent = async (event: Omit<LogisticEvent, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newEvent: LogisticEvent = {
        ...event,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // TODO: Implementar inserção real no Supabase
      setEvents(prev => [...prev, newEvent]);
      
      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso',
        variant: 'default'
      });

      return newEvent;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Atualizar evento
  const updateEvent = async (id: string, updates: Partial<LogisticEvent>) => {
    try {
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? { ...event, ...updates, updated_at: new Date().toISOString() }
          : event
      ));

      toast({
        title: 'Sucesso',
        description: 'Evento atualizado com sucesso',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o evento',
        variant: 'destructive'
      });
    }
  };

  // Deletar evento
  const deleteEvent = async (id: string) => {
    try {
      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Evento removido com sucesso',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o evento',
        variant: 'destructive'
      });
    }
  };

  // Carregar eventos iniciais
  useEffect(() => {
    loadEvents();
  }, []);

  return {
    events: filteredEvents,
    allEvents: events,
    loading,
    filters,
    setFilters,
    metrics,
    upcomingNotifications: getUpcomingNotifications,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: () => loadEvents()
  };
};