import { useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getDate, getMonth, startOfMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Funções de tradução temporárias (feature devolucoes removida)
const translateStatus = (status: string) => status;
const translateStatusMoney = (status: string) => status;

interface ContributionDay {
  date: string; // ISO date string (e.g., "2025-09-13")
  count: number;
  returns?: Array<{
    dateType: 'delivery' | 'review';
    [key: string]: any;
  }>; // Array de devoluções com tipo
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
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'review'>('all');
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
    let lastMonth: number | null = null;

    for (let i = 0; i < weeks; i++) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      });

      // Check if this week starts a new month
      const firstDayOfWeek = weekDays[0];
      const currentMonth = getMonth(firstDayOfWeek);
      const isNewMonth = lastMonth !== null && currentMonth !== lastMonth;
      
      weeksArray.push(
        <div key={i} className={`flex flex-col gap-1 ${isNewMonth ? 'ml-3 pl-3 border-l-2 border-primary/30' : ''}`}>
          {weekDays.map((day, index) => {
            const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
            const dayNumber = getDate(day);
            const isFirstOfMonth = getDate(day) === 1;
            const isTodayDay = isToday(day);
            
            // Contar tipos de eventos
            const allDeliveries = contribution?.returns?.filter(r => r.dateType === 'delivery') || [];
            const allReviews = contribution?.returns?.filter(r => r.dateType === 'review') || [];
            
            // Aplicar filtro
            let deliveryCount = allDeliveries.length;
            let reviewCount = allReviews.length;
            
            if (filterType === 'delivery') {
              reviewCount = 0;
            } else if (filterType === 'review') {
              deliveryCount = 0;
            }
            
            const hasMultipleTypes = deliveryCount > 0 && reviewCount > 0;
            const totalCount = deliveryCount + reviewCount;
            
            // Determinar estilo do quadrado
            let borderStyle = '';
            let backgroundStyle = '';
            let borderWidth = hasMultipleTypes ? 'border-[3px]' : 'border-2';
            
            if (isTodayDay) {
              backgroundStyle = 'bg-yellow-400 dark:bg-yellow-500';
              borderStyle = 'border-yellow-600 dark:border-yellow-700';
            } else if (hasMultipleTypes) {
              // Gradiente diagonal para múltiplos tipos
              backgroundStyle = 'bg-gradient-to-br from-blue-500 via-blue-500 to-orange-500 [background-size:100%_100%] from-[0%] via-[50%] to-[50%]';
              borderStyle = 'border-blue-600';
            } else if (deliveryCount > 0) {
              // Apenas entregas - borda azul
              borderStyle = deliveryCount <= 2 ? 'border-blue-400/60' : 
                           deliveryCount <= 5 ? 'border-blue-500/80' : 
                           'border-blue-600';
            } else if (reviewCount > 0) {
              // Apenas revisões - borda laranja
              borderStyle = reviewCount <= 2 ? 'border-orange-400/60' : 
                           reviewCount <= 5 ? 'border-orange-500/80' : 
                           'border-orange-600';
            } else {
              borderStyle = 'border-border';
              borderWidth = 'border-2';
            }

            return (
              <div
                key={index}
                className={`w-8 h-8 rounded-md ${borderWidth} ${borderStyle} ${backgroundStyle} hover:border-primary hover:shadow-md transition-all cursor-pointer group relative flex flex-col items-center justify-center overflow-hidden`}
                title={`${format(day, "PPP", { locale: ptBR })}`}
                onClick={() => handleDayClick(contribution, day)}
              >
                {/* Ícones pequenos quando há eventos */}
                {!isTodayDay && deliveryCount > 0 && reviewCount > 0 && (
                  <div className="absolute top-0 left-0 right-0 flex justify-between px-0.5">
                    <span className="text-[6px]">📦</span>
                    <span className="text-[6px]">⏰</span>
                  </div>
                )}
                {!isTodayDay && deliveryCount > 0 && reviewCount === 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">📦</span>
                )}
                {!isTodayDay && reviewCount > 0 && deliveryCount === 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">⏰</span>
                )}
                
                <span className={`text-[9px] font-medium z-10 ${isTodayDay ? 'text-blue-700 dark:text-blue-900 font-bold' : isFirstOfMonth ? 'text-primary font-bold' : 'text-foreground/70'}`}>
                  {dayNumber}
                </span>
                
                {/* Tooltip detalhado */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 border min-w-[200px]">
                  <div className="font-semibold mb-1 border-b pb-1">
                    {format(day, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  {deliveryCount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                      <span>📦 {deliveryCount} Entrega{deliveryCount > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                      <span>⏰ {reviewCount} Revisã{reviewCount > 1 ? 'ões' : 'o'}</span>
                    </div>
                  )}
                  {totalCount === 0 && (
                    <div className="text-muted-foreground">Sem devoluções</div>
                  )}
                  {totalCount > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1.5 pt-1 border-t">
                      Clique para detalhes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
      
      // Update lastMonth for next iteration
      lastMonth = currentMonth;
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

  // Render day labels (all days)
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <>
      <div className="space-y-4">
        {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
        
        {/* Filtros */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Filtrar por:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'all' 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-background border-border hover:bg-accent'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('delivery')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'delivery' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-background border-blue-400/50 hover:bg-blue-50 dark:hover:bg-blue-950'
            }`}
          >
            📦 Entregas
          </button>
          <button
            onClick={() => setFilterType('review')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'review' 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-background border-orange-400/50 hover:bg-orange-50 dark:hover:bg-orange-950'
            }`}
          >
            ⏰ Revisões
          </button>
        </div>
        
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max">
            <div className="flex flex-col justify-between mt-6 mr-2 gap-1">
              {dayLabels.map((label, index) => (
                <div key={index} className="text-xs text-muted-foreground h-8 flex items-center">
                  {label}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex justify-between gap-2 mb-2">{renderMonthLabels()}</div>
              <div className="flex gap-1">{renderWeeks()}</div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4 text-xs items-center text-muted-foreground flex-wrap">
            <span className="font-medium">Tipos de Evento:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-blue-500"></div>
              <span>📦 Previsão Entrega</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-orange-500"></div>
              <span>⏰ Prazo Limite Revisão</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-blue-500 bg-gradient-to-br from-blue-500 via-blue-500 to-orange-500 [background-size:100%_100%] from-[0%] via-[50%] to-[50%]"></div>
              <span>Ambos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-yellow-600 bg-yellow-400"></div>
              <span>⭐ Hoje</span>
            </div>
          </div>
          
          <div className="flex gap-3 text-xs items-center text-muted-foreground">
            <span className="font-medium">Intensidade:</span>
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-md border-2 border-border" />
              <div className="w-6 h-6 rounded-md border-2 border-primary/50" />
              <div className="w-6 h-6 rounded-md border-2 border-primary/70" />
              <div className="w-6 h-6 rounded-md border-2 border-primary/90" />
              <div className="w-6 h-6 rounded-md border-2 border-primary" />
            </div>
            <span>(1-2, 3-5, 6-10, 10+)</span>
          </div>
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
                          {ret.status?.id ? translateStatus(ret.status.id) : 'N/A'}
                        </Badge>
                        {ret.status_money?.id && (
                          <Badge variant="outline" className="block mt-1">
                            {translateStatusMoney(ret.status_money.id)}
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
