import { useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContributionDay {
  date: string; // ISO date string (e.g., "2025-09-13")
  count: number;
}

interface ActivityCalendarProps {
  data: ContributionDay[]; // Contribution data
  title?: string;
}

const ActivityCalendar = ({ data, title = "Atividade dos Últimos 12 Meses" }: ActivityCalendarProps) => {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const today = new Date();
  const startDate = subDays(today, 364); // One year back
  const weeks = 53;

  // Process data prop
  useEffect(() => {
    setContributions(data.map((item) => ({ ...item, date: new Date(item.date).toISOString() })));
  }, [data]);

  // Get color based on contribution count using CSS variables
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/30";
    if (count <= 2) return "bg-primary/20";
    if (count <= 5) return "bg-primary/40";
    if (count <= 10) return "bg-primary/60";
    return "bg-primary/80";
  };

  // Render weeks
  const renderWeeks = () => {
    const weeksArray = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    for (let i = 0; i < weeks; i++) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      });

      weeksArray.push(
        <div key={i} className="flex flex-col gap-1">
          {weekDays.map((day, index) => {
            const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
            const colorClass = getColorClass(contribution?.count || 0);
            const dayNumber = getDate(day);

            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-sm ${colorClass} hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer group relative`}
                title={`${format(day, "PPP", { locale: ptBR })}: ${contribution?.count || 0} atividades`}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 border">
                  {format(day, "dd/MM/yyyy", { locale: ptBR })}: {contribution?.count || 0}
                </div>
              </div>
            );
          })}
        </div>
      );
      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeksArray;
  };

  // Render month labels with numbers
  const renderMonthLabels = () => {
    const months = [];
    let currentMonth = startDate;
    const monthsInYear = 12;
    
    for (let i = 0; i < monthsInYear; i++) {
      months.push(
        <div key={i} className="text-xs text-muted-foreground min-w-[60px]">
          {format(currentMonth, "MMM", { locale: ptBR })}
        </div>
      );
      currentMonth = addDays(currentMonth, 30);
    }
    return months;
  };

  // Render day labels (only show Mon, Wed, Fri to save space)
  const dayLabels = [
    { day: "Dom", show: false },
    { day: "Seg", show: true },
    { day: "Ter", show: false },
    { day: "Qua", show: true },
    { day: "Qui", show: false },
    { day: "Sex", show: true },
    { day: "Sáb", show: false },
  ];

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max">
          <div className="flex flex-col justify-between mt-6 mr-2 gap-1">
            {dayLabels.map((label, index) => (
              <div key={index} className="text-xs text-muted-foreground h-3 flex items-center">
                {label.show ? label.day : ""}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="flex justify-between gap-2 mb-2">{renderMonthLabels()}</div>
            <div className="flex gap-1">{renderWeeks()}</div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 text-xs items-center text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/60" />
          <div className="w-3 h-3 rounded-sm bg-primary/80" />
        </div>
        <span>Mais</span>
      </div>
    </div>
  );
};

export { ActivityCalendar };
