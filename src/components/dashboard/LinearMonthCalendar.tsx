import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const translateStatus = (status: string) => status;
const translateStatusMoney = (status: string) => status;

interface ContributionDay {
  date: string;
  count: number;
  returns?: Array<{
    dateType: 'delivery' | 'review';
    [key: string]: any;
  }>;
  claims?: Array<{
    dateType: 'created' | 'deadline';
    [key: string]: any;
  }>;
}

interface LinearMonthCalendarProps {
  data: ContributionDay[];
  monthsBack?: number;
  monthsForward?: number;
}

const LinearMonthCalendar = ({ 
  data, 
  monthsBack = 6,
  monthsForward = 6 
}: LinearMonthCalendarProps) => {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'review' | 'claim_created' | 'claim_deadline'>('all');
  
  const today = new Date();
  const startMonth = subMonths(today, monthsBack);
  const endMonth = addMonths(today, monthsForward);

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

  const handleDayClick = (contribution: ContributionDay | undefined) => {
    if (contribution && contribution.count > 0) {
      setSelectedDay(contribution);
      setIsDialogOpen(true);
    }
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Preencher dias vazios no início para alinhar com dia da semana
    const startDayOfWeek = getDay(monthStart);
    const emptyDays = Array(startDayOfWeek).fill(null);
    
    return (
      <div key={monthDate.toISOString()} className="border-b border-border/30 last:border-b-0">
        <div className="flex items-center">
          {/* Nome do mês */}
          <div className="w-16 flex-shrink-0 text-xs font-medium text-muted-foreground py-2 pl-2">
            {format(monthDate, "MMM", { locale: ptBR }).toUpperCase()}
          </div>
          
          {/* Dias do mês */}
          <div className="flex-1 grid grid-cols-31 gap-[2px] py-1">
            {emptyDays.map((_, idx) => (
              <div key={`empty-${idx}`} className="w-7 h-7" />
            ))}
            {days.map((day, idx) => {
              const contribution = contributions.find((c) => isSameDay(new Date(c.date), day));
              
              const allDeliveries = contribution?.returns?.filter(r => r.dateType === 'delivery') || [];
              const allReviews = contribution?.returns?.filter(r => r.dateType === 'review') || [];
              const allClaimCreated = contribution?.claims?.filter(c => c.dateType === 'created') || [];
              const allClaimDeadline = contribution?.claims?.filter(c => c.dateType === 'deadline') || [];
              
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
              const isTodayDay = isToday(day);
              
              let bgStyle = '';
              let borderStyle = '';
              
              if (isTodayDay) {
                bgStyle = 'bg-yellow-400 dark:bg-yellow-500';
                borderStyle = 'border-yellow-600';
              } else if (hasMultipleTypes) {
                bgStyle = 'bg-gradient-to-br from-blue-600 via-orange-600 to-purple-600';
                borderStyle = 'border-blue-600';
              } else if (deliveryCount > 0) {
                borderStyle = deliveryCount <= 2 ? 'border-blue-400/60' : 
                             deliveryCount <= 5 ? 'border-blue-500/80' : 
                             'border-blue-600';
              } else if (reviewCount > 0) {
                borderStyle = reviewCount <= 2 ? 'border-orange-400/60' : 
                             reviewCount <= 5 ? 'border-orange-500/80' : 
                             'border-orange-600';
              } else if (claimCreatedCount > 0) {
                borderStyle = claimCreatedCount <= 2 ? 'border-green-400/60' : 
                             claimCreatedCount <= 5 ? 'border-green-500/80' : 
                             'border-green-600';
              } else if (claimDeadlineCount > 0) {
                borderStyle = claimDeadlineCount <= 2 ? 'border-red-400/60' : 
                             claimDeadlineCount <= 5 ? 'border-red-500/80' : 
                             'border-red-600';
              } else {
                borderStyle = 'border-border/30';
              }

              return (
                <div
                  key={idx}
                  className={`w-7 h-7 rounded border-2 ${borderStyle} ${bgStyle} hover:border-primary hover:shadow-md transition-all cursor-pointer group relative flex items-center justify-center text-[9px] font-medium ${
                    isTodayDay ? 'text-blue-900' : hasMultipleTypes ? 'text-white' : 'text-foreground/70'
                  }`}
                  onClick={() => handleDayClick(contribution)}
                >
                  {format(day, "d")}
                  
                  {/* Tooltip */}
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
                      <div className="text-muted-foreground">Sem eventos</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const months = [];
  let currentMonth = startMonth;
  while (currentMonth <= endMonth) {
    months.push(new Date(currentMonth));
    currentMonth = addMonths(currentMonth, 1);
  }

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

        {/* Cabeçalho dos dias da semana */}
        <div className="flex items-center border-b border-border pb-2">
          <div className="w-16 flex-shrink-0"></div>
          <div className="flex-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>
        </div>

        {/* Meses em linhas */}
        <div className="border border-border/30 rounded-lg overflow-hidden bg-card">
          {months.map(month => renderMonth(month))}
        </div>

        {/* Legenda */}
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

      {/* Dialog com detalhes */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(new Date(selectedDay.date), "PPP", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {selectedDay && (
              <div className="space-y-4">
                {selectedDay.returns?.filter(r => r.dateType === 'delivery').map((ret, idx) => (
                  <div key={`delivery-${idx}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">📦 Entrega</Badge>
                      <span className="text-sm font-medium">Pedido #{ret.order_id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>SKU: {ret.sku}</p>
                      <p>Status: {translateStatus(ret.status_devolucao)}</p>
                    </div>
                  </div>
                ))}
                {selectedDay.returns?.filter(r => r.dateType === 'review').map((ret, idx) => (
                  <div key={`review-${idx}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950">⏰ Revisão</Badge>
                      <span className="text-sm font-medium">Pedido #{ret.order_id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>SKU: {ret.sku}</p>
                      <p>Status: {translateStatus(ret.status_devolucao)}</p>
                    </div>
                  </div>
                ))}
                {selectedDay.claims?.filter(c => c.dateType === 'created').map((claim, idx) => (
                  <div key={`claim-created-${idx}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">📝 Reclamação Criada</Badge>
                      <span className="text-sm font-medium">Claim #{claim.claim_id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Tipo: {claim.tipo_reclamacao}</p>
                      <p>Status: {claim.status_reclamacao}</p>
                    </div>
                  </div>
                ))}
                {selectedDay.claims?.filter(c => c.dateType === 'deadline').map((claim, idx) => (
                  <div key={`claim-deadline-${idx}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-red-50 dark:bg-red-950">🔔 Prazo de Análise</Badge>
                      <span className="text-sm font-medium">Claim #{claim.claim_id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Tipo: {claim.tipo_reclamacao}</p>
                      <p>Status: {claim.status_reclamacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LinearMonthCalendar;
