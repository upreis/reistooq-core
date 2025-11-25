import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, isSameDay, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";

interface ContributionDay {
  date: string;
  count: number;
  items?: any[];
}

interface HorizontalSemesterCalendarProps {
  data: ContributionDay[];
  onDayClick?: (contribution: ContributionDay, date: Date) => void;
  startDate?: Date;
}

export function HorizontalSemesterCalendar({ 
  data = [], 
  onDayClick,
  startDate = startOfYear(new Date())
}: HorizontalSemesterCalendarProps) {
  
  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    if (count <= 2) return "bg-emerald-200 dark:bg-emerald-900/40";
    if (count <= 5) return "bg-emerald-300 dark:bg-emerald-800/50";
    if (count <= 8) return "bg-emerald-400 dark:bg-emerald-700/60";
    if (count <= 12) return "bg-emerald-500 dark:bg-emerald-600/70";
    return "bg-emerald-600 dark:bg-emerald-500/80";
  };

  const getDayContribution = (date: Date): ContributionDay => {
    const dateStr = format(date, "yyyy-MM-dd");
    return data.find(d => d.date === dateStr) || { date: dateStr, count: 0 };
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  // Gera 6 meses a partir da data inicial
  const months = Array.from({ length: 6 }, (_, i) => addMonths(startDate, i));

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Calendário Semestral de Atividades</h3>
          <p className="text-sm text-muted-foreground">
            Visualização horizontal dos últimos 6 meses
          </p>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-6 min-w-max">
            {months.map((monthStart, monthIndex) => {
              const monthEnd = endOfMonth(monthStart);
              const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
              
              // Calcula o dia da semana do primeiro dia (0 = domingo)
              const firstDayWeekday = getDay(monthStart);
              
              // Células vazias antes do primeiro dia
              const emptyDays = Array.from({ length: firstDayWeekday }, (_, i) => i);

              return (
                <div key={monthIndex} className="flex flex-col gap-3">
                  {/* Cabeçalho do mês */}
                  <div className="text-center pb-2 border-b-2 border-primary/20">
                    <div className="text-sm font-bold uppercase">
                      {format(monthStart, "MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(monthStart, "yyyy")}
                    </div>
                  </div>

                  {/* Grade de dias da semana */}
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, idx) => (
                      <div
                        key={idx}
                        className="w-8 h-6 flex items-center justify-center text-[10px] font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Grade de dias do mês */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Células vazias */}
                    {emptyDays.map((idx) => (
                      <div key={`empty-${idx}`} className="w-8 h-8" />
                    ))}
                    
                    {/* Dias do mês */}
                    {daysInMonth.map((day, dayIndex) => {
                      const contribution = getDayContribution(day);
                      const colorClass = getIntensityColor(contribution.count);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={dayIndex}
                          className={`
                            w-8 h-8 rounded-md flex items-center justify-center
                            text-xs font-medium cursor-pointer
                            border transition-all
                            ${colorClass}
                            ${isToday ? 'ring-2 ring-primary ring-offset-1' : 'border-border/40'}
                            hover:scale-110 hover:shadow-md hover:z-10
                            group relative
                          `}
                          onClick={() => onDayClick?.(contribution, day)}
                          title={`${format(day, "PPP", { locale: ptBR })}\n${contribution.count} atividade(s)`}
                        >
                          <span className={contribution.count > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
                            {format(day, "d")}
                          </span>

                          {/* Tooltip ao hover */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border">
                            <div className="font-semibold">{format(day, "d 'de' MMMM", { locale: ptBR })}</div>
                            <div className="text-muted-foreground">{contribution.count} atividade(s)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Clique em qualquer dia para ver detalhes
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Menos</span>
            <div className="flex gap-1">
              {[0, 2, 5, 8, 12, 15].map((count, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-sm ${getIntensityColor(count)}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Mais</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
