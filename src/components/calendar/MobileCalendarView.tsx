import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogisticEvent, CalendarMetrics } from '@/types/logistics';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MobileCalendarViewProps {
  currentDate: Date;
  events: LogisticEvent[];
  metrics: CalendarMetrics;
  onDateChange: (date: Date) => void;
  onEventClick: (event: LogisticEvent) => void;
  onAddEvent: () => void;
  onDayClick: (date: Date) => void;
}

export const MobileCalendarView: React.FC<MobileCalendarViewProps> = ({
  currentDate,
  events,
  metrics,
  onDateChange,
  onEventClick,
  onAddEvent,
  onDayClick
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gestos de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      onDateChange(addDays(currentDate, 7)); // Próxima semana
    }
    if (isRightSwipe) {
      onDateChange(subDays(currentDate, 7)); // Semana anterior
    }
  };

  // Obter dias da semana atual
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Obter eventos por dia
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };

  const getEventColor = (event: LogisticEvent) => {
    if (event.status === 'completed') return 'bg-success/20 text-success border-success/30';
    if (event.status === 'cancelled') return 'bg-muted/50 text-muted-foreground border-muted';
    if (event.status === 'delayed') return 'bg-destructive/20 text-destructive border-destructive/30';
    
    if (event.priority === 'critical') return 'bg-destructive/20 text-destructive border-destructive/30';
    if (event.priority === 'high') return 'bg-warning/20 text-warning border-warning/30';
    
    switch (event.type) {
      case 'delivery': return 'bg-primary/20 text-primary border-primary/30';
      case 'pickup': return 'bg-secondary/20 text-secondary border-secondary/30';
      default: return 'bg-muted/20 text-muted-foreground border-muted';
    }
  };

  return (
    <div className="lg:hidden space-y-4">
      {/* Header Mobile */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateChange(subDays(currentDate, 7))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="text-center">
          <h2 className="font-semibold text-primary">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-xs text-muted-foreground">
            Semana de {format(weekStart, 'dd/MM')} - {format(weekEnd, 'dd/MM')}
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateChange(addDays(currentDate, 7))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-card rounded-lg border text-center">
          <div className="text-lg font-bold text-primary">{metrics.totalEvents}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-3 bg-card rounded-lg border text-center">
          <div className="text-lg font-bold text-blue-600">{metrics.pendingDeliveries}</div>
          <div className="text-xs text-muted-foreground">Entregas</div>
        </div>
        {metrics.criticalEvents > 0 && (
          <div className="col-span-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <div className="text-lg font-bold text-destructive animate-pulse">
              {metrics.criticalEvents}
            </div>
            <div className="text-xs text-destructive">Eventos Críticos</div>
          </div>
        )}
      </div>

      {/* Vista Semanal Touch-Friendly */}
      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="space-y-2 select-none"
      >
        {weekDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "p-4 bg-card rounded-lg border cursor-pointer transition-all duration-200",
                isToday && "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                "active:scale-98 touch-manipulation"
              )}
            >
              {/* Cabeçalho do Dia */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className={cn(
                    "font-semibold",
                    isToday ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'EEEE', { locale: ptBR })}
                  </h3>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {format(day, 'd')}
                  </p>
                </div>
                
                <Badge variant={dayEvents.length > 0 ? "default" : "secondary"}>
                  {dayEvents.length} eventos
                </Badge>
              </div>

              {/* Lista de Eventos */}
              <div className="space-y-2">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={cn(
                      "p-2 rounded border text-sm transition-all duration-200",
                      getEventColor(event),
                      "active:scale-95 touch-manipulation"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">
                        {event.title}
                      </span>
                      {event.time && (
                        <span className="text-xs ml-2">
                          {event.time}
                        </span>
                      )}
                    </div>
                    {event.customer && (
                      <div className="text-xs opacity-75 truncate">
                        {event.customer}
                      </div>
                    )}
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center py-1">
                    +{dayEvents.length - 3} mais eventos
                  </div>
                )}
                
                {dayEvents.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum evento agendado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Flutuante de Adicionar */}
      <Button
        onClick={onAddEvent}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};