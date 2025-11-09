import { useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ContributionDay {
  date: string; // ISO date string (e.g., "2025-09-13")
  count: number;
  returns?: any[]; // Array de devoluções (opcional para compatibilidade)
}

interface ActivityCalendarProps {
  data: ContributionDay[]; // Contribution data
  title?: string;
  monthsBack?: number; // Meses para trás (padrão: 12)
  monthsForward?: number; // Meses para frente (padrão: 0)
}

const ActivityCalendar = ({ 
  data, 
  title = "Atividade dos Últimos 12 Meses",
  monthsBack = 12,
  monthsForward = 0 
}: ActivityCalendarProps) => {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const today = new Date();
  const startDate = subDays(today, monthsBack * 30); // Aproximado
  const endDate = addDays(today, monthsForward * 30); // Aproximado
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(totalDays / 7);

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

  // Handle day click
  const handleDayClick = (contribution: ContributionDay | undefined, day: Date) => {
    if (contribution && contribution.count > 0) {
      setSelectedDay(contribution);
      setIsDialogOpen(true);
    }
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
                onClick={() => handleDayClick(contribution, day)}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 border">
                  {format(day, "dd/MM/yyyy", { locale: ptBR })}: {contribution?.count || 0}
                  {contribution && contribution.count > 0 && (
                    <span className="block text-muted-foreground text-[10px] mt-0.5">
                      Clique para ver detalhes
                    </span>
                  )}
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
    const totalMonths = monthsBack + monthsForward;
    
    for (let i = 0; i < totalMonths; i++) {
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
    <>
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

      {/* Dialog com detalhes das devoluções */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Devoluções de {selectedDay && format(new Date(selectedDay.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {selectedDay?.returns && selectedDay.returns.length > 0 ? (
                selectedDay.returns.map((ret: any, index: number) => (
                  <div 
                    key={`${ret.id}-${index}`}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">ID: {ret.id || 'N/A'}</span>
                          <Badge variant={ret.dateType === 'delivery' ? 'default' : 'secondary'}>
                            {ret.dateType === 'delivery' ? '📦 Entrega' : '⏰ Revisão'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Pedido: #{ret.order_id}</div>
                          <div>Claim: #{ret.claim_id}</div>
                          {ret.tracking_number && (
                            <div>Rastreio: {ret.tracking_number}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={
                            ret.status?.id === 'closed' ? 'default' :
                            ret.status?.id === 'shipped' ? 'secondary' :
                            'outline'
                          }
                        >
                          {ret.status?.id || 'N/A'}
                        </Badge>
                        {ret.status_money?.id && (
                          <Badge variant="outline" className="block mt-1">
                            {ret.status_money.id}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {ret.destination_city && (
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        📍 {ret.destination_city} - {ret.destination_state}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma devolução encontrada para esta data.
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ActivityCalendar };
