import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalendarData {
  date: string;
  count: number;
  type?: string;
  details?: any;
}

interface YearlyLinearCalendarProps {
  data: CalendarData[];
  monthsBack?: number;
  monthsForward?: number;
}

const YearlyLinearCalendar: React.FC<YearlyLinearCalendarProps> = ({ 
  data, 
  monthsBack = 6, 
  monthsForward = 6 
}) => {
  const today = new Date();

  const monthsToDisplay = useMemo(() => {
    const months = [];
    for (let i = -monthsBack; i <= monthsForward; i++) {
      const monthDate = i < 0 ? subMonths(today, Math.abs(i)) : addMonths(today, i);
      months.push(monthDate);
    }
    return months;
  }, [monthsBack, monthsForward]);

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-muted/30 hover:bg-muted/50';
    if (count <= 2) return 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50';
    if (count <= 5) return 'bg-blue-300 hover:bg-blue-400 dark:bg-blue-700/50 dark:hover:bg-blue-700/70';
    if (count <= 10) return 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600/70 dark:hover:bg-blue-600/90';
    return 'bg-blue-700 hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600';
  };

  const getDayData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.find(d => d.date === dateStr);
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Get first day of week for this month
    const firstDayOfWeek = monthStart.getDay();
    
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create array with 31 slots (max days in a month)
    const cells = Array(31).fill(null);
    
    // Fill in the actual days
    daysInMonth.forEach((day) => {
      const dayOfMonth = day.getDate();
      cells[dayOfMonth - 1] = day;
    });

    return (
      <div key={format(monthDate, 'yyyy-MM')} className="flex items-center gap-1 mb-1">
        <div className="w-16 text-xs font-medium text-muted-foreground uppercase flex-shrink-0">
          {format(monthDate, 'MMM', { locale: ptBR }).replace('.', '')}
        </div>
        <div className="flex gap-[2px] flex-1 overflow-x-auto">
          {cells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="w-6 h-6 bg-muted/20 flex-shrink-0"
                />
              );
            }

            const dayData = getDayData(day);
            const count = dayData?.count || 0;
            const isToday = isSameDay(day, today);

            return (
              <TooltipProvider key={format(day, 'yyyy-MM-dd')}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        w-6 h-6 flex-shrink-0 flex items-center justify-center
                        text-[10px] font-medium cursor-pointer transition-all
                        ${getIntensityClass(count)}
                        ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                      `}
                    >
                      {day.getDate()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-semibold">{format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                      <p className="text-muted-foreground mt-1">
                        {count > 0 ? `${count} ${count === 1 ? 'evento' : 'eventos'}` : 'Sem eventos'}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with weekdays */}
      <div className="flex items-center gap-1 pb-2 border-b">
        <div className="w-16 flex-shrink-0" />
        <div className="flex gap-[2px] flex-1">
          {['Dom', 'S', 'T', 'Q', 'Q', 'S', 'Sáb'].map((day, i) => (
            <div
              key={i}
              className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-primary bg-primary/10"
            >
              {day}
            </div>
          ))}
          {/* Repeat pattern to fill 31 days */}
          {Array(24).fill(null).map((_, i) => {
            const dayIndex = (i + 7) % 7;
            const day = ['Dom', 'S', 'T', 'Q', 'Q', 'S', 'Sáb'][dayIndex];
            return (
              <div
                key={`extra-${i}`}
                className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-[10px] font-semibold text-primary bg-primary/10"
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar months */}
      <div className="overflow-x-auto pb-2">
        {monthsToDisplay.map(renderMonth)}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-muted/30" />
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30" />
          <div className="w-4 h-4 bg-blue-300 dark:bg-blue-700/50" />
          <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600/70" />
          <div className="w-4 h-4 bg-blue-700 dark:bg-blue-500" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
};

export default YearlyLinearCalendar;
