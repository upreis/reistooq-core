import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { EventModal } from '@/components/calendar/EventModal';
import { useLogisticCalendar } from '@/hooks/useLogisticCalendar';
import { useCalendarNotifications } from '@/hooks/useCalendarNotifications';
import { LogisticEvent, CalendarViewMode } from '@/types/logistics';

const Calendar: React.FC = () => {
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

  // Integração com sistema de avisos
  useCalendarNotifications({
    events: upcomingNotifications,
    onCreateSystemAlert: (alert) => {
      // TODO: Integrar com sistema de avisos do AnnouncementTicker
      console.log('Novo alerta do calendário:', alert);
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
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Calendário Logístico</span>
      </div>

      <Card>
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
};

export default Calendar;