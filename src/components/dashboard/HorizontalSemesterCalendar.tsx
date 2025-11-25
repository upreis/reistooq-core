import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, addDays, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";

interface ContributionDay {
  date: string;
  count: number;
  returns?: Array<{
    dateType: 'delivery' | 'review';
    order_id: string;
    status_devolucao?: string;
    produto_titulo?: string;
    sku?: string;
    [key: string]: any;
  }>;
  claims?: Array<{
    dateType: 'created' | 'deadline';
    claim_id: string;
    type?: string;
    status?: string;
    resource_id?: string;
    buyer_nickname?: string;
    [key: string]: any;
  }>;
}

interface HorizontalSemesterCalendarProps {
  data: ContributionDay[];
}

export function HorizontalSemesterCalendar({ 
  data = []
}: HorizontalSemesterCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'review' | 'claim_created' | 'claim_deadline'>('all');
  
  // Calcular intervalo: hoje -2m15d até hoje +2m15d
  const today = new Date();
  const startDate = subDays(subMonths(today, 2), 15);
  const endDate = addDays(addMonths(today, 2), 15);

  const getDayContribution = (date: Date): ContributionDay | undefined => {
    const dateStr = format(date, "yyyy-MM-dd");
    return data.find(d => {
      const contributionDate = new Date(d.date);
      return format(contributionDate, "yyyy-MM-dd") === dateStr;
    });
  };

  const handleDayClick = (contribution: ContributionDay | undefined, day: Date) => {
    if (contribution && contribution.count > 0) {
      setSelectedDay(contribution);
      setIsDialogOpen(true);
    }
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  // Gerar meses entre startDate e endDate
  const months: Date[] = [];
  let currentMonth = startOfMonth(startDate);
  const lastMonth = startOfMonth(endDate);
  
  while (currentMonth <= lastMonth) {
    months.push(currentMonth);
    currentMonth = addMonths(currentMonth, 1);
  }
  
  // Scroll para centralizar a data de hoje
  useEffect(() => {
    if (scrollContainerRef.current && todayRef.current) {
      const container = scrollContainerRef.current;
      const todayElement = todayRef.current;
      
      const scrollLeft = todayElement.offsetLeft - (container.clientWidth / 2) + (todayElement.clientWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Calendário de Atividades</h3>
            <p className="text-sm text-muted-foreground">
              Centralizado em hoje • 2 meses e 15 dias para cada lado
            </p>
          </div>

          <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
            <div className="inline-flex gap-6 min-w-max">
              {months.map((monthStart, monthIndex) => {
                const monthEnd = endOfMonth(monthStart);
                const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
                
                const firstDayWeekday = getDay(monthStart);
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
                        const isToday = isSameDay(day, today);
                        
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
                        
                        // Determinar estilo
                        let borderStyle = '';
                        let backgroundStyle = '';
                        
                        if (isToday) {
                          backgroundStyle = 'bg-yellow-400 dark:bg-yellow-500';
                          borderStyle = 'border-yellow-600 dark:border-yellow-700 border-2';
                        } else if (hasMultipleTypes) {
                          backgroundStyle = 'bg-gradient-to-br from-blue-600 via-orange-600 to-purple-600';
                          borderStyle = 'border-blue-600 border-2';
                        } else if (deliveryCount > 0) {
                          borderStyle = deliveryCount <= 2 ? 'border-blue-400/60 border-2' : 
                                       deliveryCount <= 5 ? 'border-blue-500/80 border-2' : 
                                       'border-blue-600 border-2';
                        } else if (reviewCount > 0) {
                          borderStyle = reviewCount <= 2 ? 'border-orange-400/60 border-2' : 
                                       reviewCount <= 5 ? 'border-orange-500/80 border-2' : 
                                       'border-orange-600 border-2';
                        } else if (claimCreatedCount > 0) {
                          borderStyle = claimCreatedCount <= 2 ? 'border-green-400/60 border-2' : 
                                       claimCreatedCount <= 5 ? 'border-green-500/80 border-2' : 
                                       'border-green-600 border-2';
                        } else if (claimDeadlineCount > 0) {
                          borderStyle = claimDeadlineCount <= 2 ? 'border-red-400/60 border-2' : 
                                       claimDeadlineCount <= 5 ? 'border-red-500/80 border-2' : 
                                       'border-red-600 border-2';
                        } else {
                          borderStyle = 'border-border border-2';
                        }

                        return (
                          <div
                            ref={isToday ? todayRef : undefined}
                            key={dayIndex}
                            className={`
                              w-8 h-8 rounded-md flex flex-col items-center justify-center
                              text-xs font-medium cursor-pointer
                              transition-all overflow-hidden
                              ${borderStyle}
                              ${backgroundStyle}
                              ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                              hover:scale-110 hover:shadow-md hover:z-10
                              group relative
                            `}
                            onClick={() => handleDayClick(contribution, day)}
                            title={`${format(day, "PPP", { locale: ptBR })}`}
                          >
                            {/* Ícones pequenos quando há eventos */}
                            {!isToday && hasMultipleTypes && (
                              <div className="absolute top-0 left-0 right-0 flex justify-between px-0.5 gap-0.5">
                                {deliveryCount > 0 && <span className="text-[5px]">📦</span>}
                                {reviewCount > 0 && <span className="text-[5px]">⏰</span>}
                                {claimCreatedCount > 0 && <span className="text-[5px]">📝</span>}
                                {claimDeadlineCount > 0 && <span className="text-[5px]">🔔</span>}
                              </div>
                            )}
                            {!isToday && !hasMultipleTypes && deliveryCount > 0 && (
                              <span className="absolute top-0 left-0.5 text-[6px]">📦</span>
                            )}
                            {!isToday && !hasMultipleTypes && reviewCount > 0 && (
                              <span className="absolute top-0 left-0.5 text-[6px]">⏰</span>
                            )}
                            {!isToday && !hasMultipleTypes && claimCreatedCount > 0 && (
                              <span className="absolute top-0 left-0.5 text-[6px]">📝</span>
                            )}
                            {!isToday && !hasMultipleTypes && claimDeadlineCount > 0 && (
                              <span className="absolute top-0 left-0.5 text-[6px]">🔔</span>
                            )}
                            
                            <span className={`text-[9px] font-medium z-10 ${isToday ? 'text-blue-700 dark:text-blue-900 font-bold' : hasMultipleTypes ? 'text-white font-bold' : 'text-foreground/70'}`}>
                              {format(day, "d")}
                            </span>

                            {/* Tooltip detalhado */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border min-w-[200px]">
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
                                <div className="text-muted-foreground">Sem atividades</div>
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
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtros */}
          <div className="pt-4 border-t">
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
                📝 Reclamações Criadas
              </button>
              <button
                onClick={() => setFilterType('claim_deadline')}
                className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                  filterType === 'claim_deadline' 
                    ? 'bg-red-500 text-white border-red-500' 
                    : 'bg-background border-red-400/50 hover:bg-red-50 dark:hover:bg-red-950'
                }`}
              >
                🔔 Prazos de Análise
              </button>
            </div>
          </div>
          
          {/* Legenda */}
          <div className="pt-4 border-t space-y-3">
            <div className="text-xs text-muted-foreground">
              Clique em qualquer dia para ver detalhes das atividades
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
                <span>📦 Devoluções Recebidas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-orange-500"></div>
                <span>⏰ Devoluções a Revisar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-500"></div>
                <span>📝 Reclamações Criadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-red-500"></div>
                <span>🔔 Prazos de Análise</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-600 via-orange-600 to-purple-600"></div>
                <span>Múltiplos tipos</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Atividades de {selectedDay && format(new Date(selectedDay.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Devoluções Recebidas */}
              {selectedDay?.returns?.filter(r => r.dateType === 'delivery').length! > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    📦 Devoluções Recebidas ({selectedDay?.returns?.filter(r => r.dateType === 'delivery').length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay?.returns?.filter(r => r.dateType === 'delivery').map((ret, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Pedido: {ret.order_id}</span>
                          {ret.status_devolucao && <Badge variant="outline">{ret.status_devolucao}</Badge>}
                        </div>
                        {ret.produto_titulo && (
                          <div className="text-sm text-muted-foreground">{ret.produto_titulo}</div>
                        )}
                        {ret.sku && (
                          <div className="text-xs text-muted-foreground mt-1">SKU: {ret.sku}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devoluções a Revisar */}
              {selectedDay?.returns?.filter(r => r.dateType === 'review').length! > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    ⏰ Devoluções a Revisar ({selectedDay?.returns?.filter(r => r.dateType === 'review').length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay?.returns?.filter(r => r.dateType === 'review').map((ret, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Pedido: {ret.order_id}</span>
                          {ret.status_devolucao && <Badge variant="outline">{ret.status_devolucao}</Badge>}
                        </div>
                        {ret.produto_titulo && (
                          <div className="text-sm text-muted-foreground">{ret.produto_titulo}</div>
                        )}
                        {ret.sku && (
                          <div className="text-xs text-muted-foreground mt-1">SKU: {ret.sku}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reclamações Criadas */}
              {selectedDay?.claims?.filter(c => c.dateType === 'created').length! > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    📝 Reclamações Criadas ({selectedDay?.claims?.filter(c => c.dateType === 'created').length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay?.claims?.filter(c => c.dateType === 'created').map((claim, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Reclamação: {claim.claim_id}</span>
                          {claim.status && <Badge variant="outline">{claim.status}</Badge>}
                        </div>
                        {claim.type && (
                          <div className="text-sm text-muted-foreground">Tipo: {claim.type}</div>
                        )}
                        {claim.buyer_nickname && (
                          <div className="text-xs text-muted-foreground mt-1">Comprador: {claim.buyer_nickname}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prazos de Análise */}
              {selectedDay?.claims?.filter(c => c.dateType === 'deadline').length! > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    🔔 Prazos de Análise ({selectedDay?.claims?.filter(c => c.dateType === 'deadline').length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDay?.claims?.filter(c => c.dateType === 'deadline').map((claim, idx) => (
                      <div key={idx} className="p-3 border rounded-lg bg-red-50 dark:bg-red-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Reclamação: {claim.claim_id}</span>
                          <Badge variant="destructive">Prazo hoje!</Badge>
                        </div>
                        {claim.type && (
                          <div className="text-sm text-muted-foreground">Tipo: {claim.type}</div>
                        )}
                        {claim.buyer_nickname && (
                          <div className="text-xs text-muted-foreground mt-1">Comprador: {claim.buyer_nickname}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
