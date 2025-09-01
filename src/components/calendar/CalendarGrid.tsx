import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogisticEvent } from '@/types/logistics';
import { cn } from '@/lib/utils';
import { 
  Truck, 
  Package, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar as CalendarIcon 
} from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  events: LogisticEvent[];
  onEventClick: (event: LogisticEvent) => void;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getEventIcon = (type: LogisticEvent['type']) => {
  switch (type) {
    case 'delivery':
      return <Truck className="w-3 h-3" />;
    case 'pickup':
      return <Package className="w-3 h-3" />;
    case 'deadline':
      return <Clock className="w-3 h-3" />;
    case 'meeting':
      return <CalendarIcon className="w-3 h-3" />;
    default:
      return <AlertTriangle className="w-3 h-3" />;
  }
};

const getEventColor = (type: LogisticEvent['type'], status: LogisticEvent['status'], priority: LogisticEvent['priority']) => {
  // Cores baseadas no status primeiro usando design system
  if (status === 'completed') return 'bg-success text-success-foreground';
  if (status === 'cancelled') return 'bg-muted text-muted-foreground';
  if (status === 'delayed') return 'bg-destructive text-destructive-foreground';
  
  // Depois por prioridade
  if (priority === 'critical') return 'bg-destructive text-destructive-foreground';
  if (priority === 'high') return 'bg-warning text-warning-foreground';
  
  // Por último, por tipo usando tokens semânticos
  switch (type) {
    case 'delivery':
      return 'bg-primary text-primary-foreground';
    case 'pickup':
      return 'bg-secondary text-secondary-foreground';
    case 'deadline':
      return 'bg-warning text-warning-foreground';
    case 'transport':
      return 'bg-info text-info-foreground';
    case 'meeting':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPriorityIndicator = (priority: LogisticEvent['priority']) => {
  switch (priority) {
    case 'critical':
      return <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />;
    case 'high':
      return <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full" />;
    default:
      return null;
  }
};

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  events,
  onEventClick,
  onDayClick
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

  const renderCalendarDays = () => {
    const days = [];

    // Dias do mês anterior
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const date = new Date(year, month - 1, day);
      
      days.push(
        <button
          key={`prev-${day}`}
          onClick={() => onDayClick(date)}
          className="h-24 p-2 border border-muted text-muted-foreground bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="text-sm">{day}</div>
        </button>
      );
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(event => event.date === dateStr);
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push(
        <button
          key={day}
          onClick={() => onDayClick(date)}
          className={cn(
            "h-16 sm:h-20 md:h-24 p-1 sm:p-2 border border-muted hover:bg-muted/50 transition-all duration-200 text-left relative touch-manipulation",
            isToday && "bg-primary/10 border-primary ring-2 ring-primary/20",
            "active:scale-98 transform"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday && "text-primary font-bold"
          )}>
            {day}
          </div>
          
          <div className="space-y-0.5 sm:space-y-1 max-h-12 sm:max-h-14 md:max-h-16 overflow-hidden">
            {dayEvents.slice(0, window.innerWidth < 640 ? 1 : 2).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                className={cn(
                  "text-xs px-1 sm:px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center space-x-1 relative",
                  getEventColor(event.type, event.status, event.priority),
                  "hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                )}
                title={`${event.title} - ${event.time || 'Horário não definido'}`}
              >
                <span className="hidden sm:inline">{getEventIcon(event.type)}</span>
                <span className="truncate text-[10px] sm:text-xs">{event.title}</span>
                {getPriorityIndicator(event.priority)}
              </div>
            ))}
            
            {dayEvents.length > 2 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayEvents.length - 2} mais
              </div>
            )}
          </div>
        </button>
      );
    }

    // Dias do próximo mês para completar a grade
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    const nextMonthDays = totalCells - (firstDayOfMonth + daysInMonth);
    
    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(year, month + 1, day);
      
      days.push(
        <button
          key={`next-${day}`}
          onClick={() => onDayClick(date)}
          className="h-24 p-2 border border-muted text-muted-foreground bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="text-sm">{day}</div>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((day) => (
          <div 
            key={day} 
            className="p-3 text-center text-sm font-semibold text-muted-foreground border-b"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grade do calendário */}
      <div className="grid grid-cols-7 gap-0 border border-muted rounded-lg overflow-hidden">
        {renderCalendarDays()}
      </div>
    </div>
  );
};