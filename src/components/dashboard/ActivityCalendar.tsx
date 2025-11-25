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
  claims?: Array<{
    dateType: 'created' | 'deadline';
    [key: string]: any;
  }>; // Array de reclamações com tipo
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
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'review' | 'claim_created' | 'claim_deadline'>('all');
  const today = new Date();
  const startDate = subDays(today, monthsBack * 30); // Aproximado
  const endDate = addDays(today, monthsForward * 30); // Aproximado
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(totalDays / 7);

  // Process data prop - combinar dados do mesmo dia
  useEffect(() => {
    const merged = data.reduce((acc: Record<string, ContributionDay>, item) => {
      const dateStr = new Date(item.date).toISOString();
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          count: 0,
          returns: [],
          claims: []
        };
      }
      acc[dateStr].count += item.count || 0;
      if (item.returns) acc[dateStr].returns = [...(acc[dateStr].returns || []), ...item.returns];
      if (item.claims) acc[dateStr].claims = [...(acc[dateStr].claims || []), ...item.claims];
      return acc;
    }, {});
    setContributions(Object.values(merged));
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

  // Render calendar by months
  const renderCalendar = () => {
    const monthsArray = [];
    let currentDate = new Date(startDate);
    const totalMonths = monthsBack + monthsForward;

    for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
      const monthStart = startOfMonth(currentDate);
      const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      
      // Calcular quantas semanas este mês precisa
      let weeksInMonth = 0;
      let tempDate = new Date(monthStart);
      const monthNumber = getMonth(monthStart);
      
      while (getMonth(tempDate) === monthNumber || weeksInMonth === 0) {
        weeksInMonth++;
        tempDate = addDays(tempDate, 7);
        if (weeksInMonth > 6) break; // máximo 6 semanas por mês
      }

      const weekColumns = [];
      let weekStart = firstWeekStart;

      for (let weekIndex = 0; weekIndex < weeksInMonth; weekIndex++) {
        const weekDays = eachDayOfInterval({
          start: weekStart,
          end: endOfWeek(weekStart, { weekStartsOn: 0 }),
        });

        weekColumns.push(
          <div key={weekIndex} className="flex flex-col gap-1">
            {weekDays.map((day, dayIndex) => {
              const dayMonth = getMonth(day);
            const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
            const dayNumber = getDate(day);
            const isFirstOfMonth = getDate(day) === 1;
            const isTodayDay = isToday(day);
            
            // Contar tipos de eventos
            const allDeliveries = contribution?.returns?.filter(r => r.dateType === 'delivery') || [];
            const allReviews = contribution?.returns?.filter(r => r.dateType === 'review') || [];
            const allClaimCreated = contribution?.claims?.filter(c => c.dateType === 'created') || [];
            const allClaimDeadline = contribution?.claims?.filter(c => c.dateType === 'deadline') || [];
            
            // Aplicar filtro
            let deliveryCount = allDeliveries.length;
            let reviewCount = allReviews.length;
            let claimCreatedCount = allClaimCreated.length;
            let claimDeadlineCount = allClaimDeadline.length;
            
            if (filterType === 'delivery') {
              reviewCount = 0;
              claimCreatedCount = 0;
              claimDeadlineCount = 0;
            } else if (filterType === 'review') {
              deliveryCount = 0;
              claimCreatedCount = 0;
              claimDeadlineCount = 0;
            } else if (filterType === 'claim_created') {
              deliveryCount = 0;
              reviewCount = 0;
              claimDeadlineCount = 0;
            } else if (filterType === 'claim_deadline') {
              deliveryCount = 0;
              reviewCount = 0;
              claimCreatedCount = 0;
            }
            
            const hasMultipleTypes = [deliveryCount, reviewCount, claimCreatedCount, claimDeadlineCount].filter(c => c > 0).length > 1;
            const totalCount = deliveryCount + reviewCount + claimCreatedCount + claimDeadlineCount;
            
            // Determinar estilo do quadrado
            let borderStyle = '';
            let backgroundStyle = '';
            let borderWidth = hasMultipleTypes ? 'border-[3px]' : 'border-2';
            
            if (isTodayDay) {
              backgroundStyle = 'bg-yellow-400 dark:bg-yellow-500';
              borderStyle = 'border-yellow-600 dark:border-yellow-700';
            } else if (hasMultipleTypes) {
              // Gradiente para múltiplos tipos com fundo mais escuro
              backgroundStyle = 'bg-gradient-to-br from-blue-600 via-orange-600 to-purple-600';
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
            } else if (claimCreatedCount > 0) {
              // Reclamações criadas - borda verde
              borderStyle = claimCreatedCount <= 2 ? 'border-green-400/60' : 
                           claimCreatedCount <= 5 ? 'border-green-500/80' : 
                           'border-green-600';
            } else if (claimDeadlineCount > 0) {
              // Prazos de reclamação - borda vermelha
              borderStyle = claimDeadlineCount <= 2 ? 'border-red-400/60' : 
                           claimDeadlineCount <= 5 ? 'border-red-500/80' : 
                           'border-red-600';
            } else {
              borderStyle = 'border-border';
              borderWidth = 'border-2';
            }

              // Ocultar dias que não pertencem ao mês atual
              const isDifferentMonth = dayMonth !== monthNumber;

              return (
                <div
                  key={dayIndex}
                  className={`w-8 h-8 rounded-md ${borderWidth} ${borderStyle} ${backgroundStyle} hover:border-primary hover:shadow-md transition-all cursor-pointer group relative flex flex-col items-center justify-center overflow-hidden ${isDifferentMonth ? 'opacity-0 pointer-events-none' : ''}`}
                title={`${format(day, "PPP", { locale: ptBR })}`}
                onClick={() => handleDayClick(contribution, day)}
              >
                {/* Ícones pequenos quando há eventos */}
                {!isTodayDay && hasMultipleTypes && (
                  <div className="absolute top-0 left-0 right-0 flex justify-between px-0.5 gap-0.5">
                    {deliveryCount > 0 && <span className="text-[5px]">📦</span>}
                    {reviewCount > 0 && <span className="text-[5px]">⏰</span>}
                    {claimCreatedCount > 0 && <span className="text-[5px]">📝</span>}
                    {claimDeadlineCount > 0 && <span className="text-[5px]">🔔</span>}
                  </div>
                )}
                {!isTodayDay && !hasMultipleTypes && deliveryCount > 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">📦</span>
                )}
                {!isTodayDay && !hasMultipleTypes && reviewCount > 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">⏰</span>
                )}
                {!isTodayDay && !hasMultipleTypes && claimCreatedCount > 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">📝</span>
                )}
                {!isTodayDay && !hasMultipleTypes && claimDeadlineCount > 0 && (
                  <span className="absolute top-0 left-0.5 text-[6px]">🔔</span>
                )}
                
                <span className={`text-[9px] font-medium z-10 ${isTodayDay ? 'text-blue-700 dark:text-blue-900 font-bold' : hasMultipleTypes ? 'text-white font-bold' : isFirstOfMonth ? 'text-primary font-bold' : 'text-foreground/70'}`}>
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
                  {claimCreatedCount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                      <span>📝 {claimCreatedCount} Reclamaçã{claimCreatedCount > 1 ? 'ões criadas' : 'o criada'}</span>
                    </div>
                  )}
                  {claimDeadlineCount > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                      <span>🔔 {claimDeadlineCount} Prazo{claimDeadlineCount > 1 ? 's' : ''} de análise</span>
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

        weekStart = addDays(weekStart, 7);
      }

      monthsArray.push(
        <div key={monthIndex} className={`flex gap-1 ${monthIndex > 0 ? 'ml-3 pl-3 border-l-2 border-primary/30' : ''}`}>
          {weekColumns}
        </div>
      );

      currentDate = addDays(currentDate, 30);
    }

    return monthsArray;
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
            📦 Devoluções Recebidas
          </button>
          <button
            onClick={() => setFilterType('review')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'review' 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-background border-orange-400/50 hover:bg-orange-50 dark:hover:bg-orange-950'
            }`}
          >
            ⏰ Devoluções a Revisar
          </button>
          <button
            onClick={() => setFilterType('claim_created')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'claim_created' 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-background border-green-400/50 hover:bg-green-50 dark:hover:bg-green-950'
            }`}
          >
            📝 Reclamações Abertas
          </button>
          <button
            onClick={() => setFilterType('claim_deadline')}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              filterType === 'claim_deadline' 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-background border-red-400/50 hover:bg-red-50 dark:hover:bg-red-950'
            }`}
          >
            🔔 Reclamações a Responder
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
              <div className="flex gap-1">{renderCalendar()}</div>
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
              <div className="w-6 h-6 rounded-md border-2 border-green-500"></div>
              <span>📝 Reclamação Criada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-red-500"></div>
              <span>🔔 Prazo de Análise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-blue-500 bg-gradient-to-br from-blue-600 via-orange-600 to-purple-600"></div>
              <span>Múltiplos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-yellow-600 bg-yellow-400"></div>
              <span>⭐ Hoje</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Dialog com detalhes das devoluções */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Eventos de {selectedDay && format(new Date(selectedDay.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {/* Devoluções */}
              {selectedDay?.returns && selectedDay.returns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Devoluções ({selectedDay.returns.length})</h4>
                  {selectedDay.returns.map((ret: any, index: number) => (
                    <div 
                      key={`return-${ret.order_id}-${index}`}
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
                            {ret.sku && <div>SKU: {ret.sku}</div>}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          {ret.status_devolucao && (
                            <Badge variant="outline">
                              {ret.status_devolucao}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {ret.produto_titulo && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          📦 {ret.produto_titulo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reclamações */}
              {selectedDay?.claims && selectedDay.claims.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Reclamações ({selectedDay.claims.length})</h4>
                  {selectedDay.claims.map((claim: any, index: number) => (
                    <div 
                      key={`claim-${claim.claim_id}-${index}`}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">Reclamação: #{claim.claim_id}</span>
                            <Badge variant={claim.dateType === 'created' ? 'default' : 'destructive'}>
                              {claim.dateType === 'created' ? '📝 Criada' : '🔔 Prazo'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {claim.resource_id && <div>Recurso: #{claim.resource_id}</div>}
                            {claim.buyer_nickname && <div>Comprador: {claim.buyer_nickname}</div>}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          {claim.type && (
                            <Badge variant="outline">
                              {claim.type}
                            </Badge>
                          )}
                          {claim.status && (
                            <Badge variant="secondary" className="block mt-1">
                              {claim.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sem dados */}
              {(!selectedDay?.returns || selectedDay.returns.length === 0) && 
               (!selectedDay?.claims || selectedDay.claims.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum evento encontrado para esta data.
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
