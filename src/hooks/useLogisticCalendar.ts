import { useState, useEffect, useMemo } from 'react';
import { addDays, startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { LogisticEvent, CalendarFilters, CalendarMetrics } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mapeamento dos dados do banco para a interface
const mapDatabaseToEvent = (dbEvent: any): LogisticEvent => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  type: dbEvent.type,
  status: dbEvent.status,
  priority: dbEvent.priority,
  date: dbEvent.event_date,
  time: dbEvent.event_time,
  duration: dbEvent.duration_minutes,
  location: dbEvent.location,
  customer: dbEvent.customer_name,
  tracking_code: dbEvent.tracking_code,
  transport_company: dbEvent.transport_company,
  notes: dbEvent.notes,
  created_at: dbEvent.created_at,
  updated_at: dbEvent.updated_at,
  reminder_sent: dbEvent.reminder_sent,
  notification_days_before: dbEvent.notification_days_before,
});

export const useLogisticCalendar = () => {
  const [events, setEvents] = useState<LogisticEvent[]>([]);
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
      let query = supabase
        .from('logistic_events')
        .select(`
          id, title, description, type, status, priority,
          event_date, event_time, duration_minutes,
          location, customer_name, tracking_code, transport_company,
          related_pedido_id, related_produto_id, integration_account_id,
          notification_days_before, reminder_sent, notes,
          created_at, updated_at
        `)
        .order('event_date', { ascending: true });

      if (startDate) {
        query = query.gte('event_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('event_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const mappedEvents = (data || []).map(mapDatabaseToEvent);
      setEvents(mappedEvents);
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
      const { data, error } = await supabase
        .from('logistic_events')
        .insert({
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status || 'scheduled',
          priority: event.priority || 'medium',
          event_date: event.date,
          event_time: event.time,
          duration_minutes: event.duration,
          location: event.location,
          customer_name: event.customer,
          tracking_code: event.tracking_code,
          transport_company: event.transport_company,
          notification_days_before: event.notification_days_before,
          notes: event.notes
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newEvent = mapDatabaseToEvent(data);
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
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.date !== undefined) updateData.event_date = updates.date;
      if (updates.time !== undefined) updateData.event_time = updates.time;
      if (updates.duration !== undefined) updateData.duration_minutes = updates.duration;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.customer !== undefined) updateData.customer_name = updates.customer;
      if (updates.tracking_code !== undefined) updateData.tracking_code = updates.tracking_code;
      if (updates.transport_company !== undefined) updateData.transport_company = updates.transport_company;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.reminder_sent !== undefined) updateData.reminder_sent = updates.reminder_sent;

      const { data, error } = await supabase
        .from('logistic_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent = mapDatabaseToEvent(data);
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
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
      const { error } = await supabase
        .from('logistic_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

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