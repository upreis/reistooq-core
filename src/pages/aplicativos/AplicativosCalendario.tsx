import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { EventModal } from '@/components/calendar/EventModal';
import { MobileCalendarView } from '@/components/calendar/MobileCalendarView';
import { useLogisticCalendar } from '@/hooks/useLogisticCalendar';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { integrationService } from '@/services/integrationService';
import { LogisticEvent, CalendarViewMode } from '@/types/logistics';
import { useToast } from '@/hooks/use-toast';

export default function AplicativosCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode['type']>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LogisticEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    events,
    loading,
    filters,
    setFilters,
    metrics,
    upcomingNotifications,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents
  } = useLogisticCalendar();

  const { toast } = useToast();

  // Integração com sistema de avisos
  useCalendarNotifications({
    events: upcomingNotifications,
    onCreateSystemAlert: async (alert) => {
      const success = await integrationService.sendSystemAlert(alert);
      if (!success) {
        console.error('Falha ao enviar alerta para o sistema');
      }
    }
  });

  useSmartNotifications({
    events,
    onCreateSystemAlert: async (alert) => {
      await integrationService.sendSystemAlert(alert);
    },
    onConflictDetected: (conflicts) => {
      toast({
        title: '⚠️ Conflito de Horários Detectado',
        description: `${conflicts.length} eventos com horários conflitantes`,
        variant: 'destructive',
        duration: 8000
      });
    },
    onSuggestOptimization: (suggestion) => {
      toast({
        title: '💡 Sugestão de Otimização',
        description: suggestion.message,
        duration: 10000
      });
    }
  });

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: LogisticEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setShowEventModal(true);
  };

  const handleAddEvent = () => {
    setSelectedDate(undefined);
    setSelectedEvent(undefined);
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(undefined);
    setSelectedDate(undefined);
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      statuses: [],
      priorities: [],
      dateRange: {}
    });
  };

  return (
    <div className="space-y-6">
      {/* Vista Mobile */}
      <MobileCalendarView
        currentDate={currentDate}
        events={events}
        metrics={metrics}
        onDateChange={setCurrentDate}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        onDayClick={handleDayClick}
      />

      {/* Vista Desktop */}
      <Card className="hidden lg:block">
        <CardContent className="p-6">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            metrics={metrics}
            onNavigate={handleNavigate}
            onViewModeChange={setViewMode}
            onToday={handleToday}
            onAddEvent={handleAddEvent}
            onToggleFilters={() => setShowFilters(true)}
            onRefresh={refreshEvents}
            loading={loading}
          />

          <div className="mt-6">
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <CalendarFilters
        isOpen={showFilters}
        onOpenChange={setShowFilters}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Modal de Evento */}
      <EventModal
        isOpen={showEventModal}
        onClose={handleCloseModal}
        onSave={createEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
        event={selectedEvent}
        initialDate={selectedDate}
      />
    </div>
  );
}