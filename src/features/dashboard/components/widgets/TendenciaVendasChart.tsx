import { useMemo, useState } from "react";
import { TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, getDaysInMonth, startOfDay, endOfDay, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ViewMode } from "./FeaturesBentoGrid";

interface VendaRealtime {
  id: string;
  integration_account_id: string;
  account_name: string | null;
  order_id: string;
  total_amount: number | null;
  date_created: string | null;
  created_at: string;
}

interface TendenciaVendasChartProps {
  selectedAccount?: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

interface TooltipData {
  xIndex: number;
  xLabel: string;
  accounts: Array<{
    name: string;
    valor: number;
    color: string;
  }>;
  xPercent: number;
}

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

// Cores alinhadas com os filtros em FeaturesBentoGrid.tsx
const ACCOUNT_COLORS: Record<string, string> = {
  "BRCR20240514161447": "#3b82f6", // blue-500
  "PLATINUMLOJA2020": "#ec4899",   // pink-500
  "UNIVERSOMELI": "#22c55e",       // green-500
  "HORE20240106205039": "#f97316", // orange-500
  "LOJAOITO": "#a855f7",           // purple-500
  "LUTHORSHOPLTDA": "#06b6d4",     // cyan-500
};

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#ec4899", // pink
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
  "#06b6d4", // cyan
];

const getAccountColor = (accountName: string, index: number): string => {
  return ACCOUNT_COLORS[accountName] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
};

export function TendenciaVendasChart({ 
  selectedAccount = "todas",
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode
}: TendenciaVendasChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());
  // Estado interno para controlar qual picker mostrar (evita flickering)
  const [pickerMode, setPickerMode] = useState<ViewMode>(viewMode);

  const { startDate, endDate, startDateISO, endDateISO } = useMemo(() => {
    const start = viewMode === "day" ? startOfDay(selectedDate) : startOfMonth(selectedDate);
    const end = viewMode === "day" ? endOfDay(selectedDate) : endOfMonth(selectedDate);
    return {
      startDate: start,
      endDate: end,
      startDateISO: formatInTimeZone(start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX"),
      endDateISO: formatInTimeZone(end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX")
    };
  }, [selectedDate, viewMode]);

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-tendencia", startDateISO, endDateISO],
    queryFn: async () => {
      // Buscar organization_id do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) return [];

      // Buscar TODOS os registros com paginação
      const allData: VendaRealtime[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      console.log(`[TendenciaVendasChart] Buscando vendas de ${startDateISO} até ${endDateISO}`);

      while (hasMore) {
        const { data, error } = await supabase
          .from("vendas_hoje_realtime")
          .select("id, integration_account_id, account_name, order_id, total_amount, date_created, created_at")
          .eq("organization_id", profile.organizacao_id)
          .gte("date_created", startDateISO)
          .lte("date_created", endDateISO)
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData.push(...(data as VendaRealtime[]));
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[TendenciaVendasChart] Total de vendas carregadas: ${allData.length}`);
      return allData;
    },
    refetchInterval: 60000,
  });

  const daysInMonth = getDaysInMonth(selectedDate);
  const maxXValue = viewMode === "day" ? 23 : daysInMonth;

  const { chartData, maxValue, accounts } = useMemo(() => {
    if (!vendas || vendas.length === 0) {
      return { chartData: new Map<string, Map<number, number>>(), maxValue: 0, accounts: [] };
    }

    const accountsSet = new Set<string>();
    const chartData = new Map<string, Map<number, number>>();

    vendas.forEach((venda) => {
      const accountName = venda.account_name || "Desconhecido";
      accountsSet.add(accountName);

      const dateStr = venda.date_created || venda.created_at;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      // Para modo "day", agrupa por hora. Para modo "month", agrupa por dia
      const groupKey = viewMode === "day" ? date.getHours() : date.getDate();
      const valor = Number(venda.total_amount) || 0;

      if (!chartData.has(accountName)) {
        chartData.set(accountName, new Map());
      }
      
      const accountData = chartData.get(accountName)!;
      const current = accountData.get(groupKey) || 0;
      accountData.set(groupKey, current + valor);
    });

    const accounts = Array.from(accountsSet);
    
    let maxValue = 1;
    chartData.forEach((accountMap) => {
      accountMap.forEach((valor) => {
        if (valor > maxValue) maxValue = valor;
      });
    });

    return { chartData, maxValue, accounts };
  }, [vendas, viewMode]);

  const filteredAccounts = selectedAccount === "todas" 
    ? accounts 
    : accounts.filter(a => a === selectedAccount);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Gerar path SVG com curvas suaves
  const generatePath = (accountName: string): string => {
    const accountData = chartData.get(accountName);
    if (!accountData || accountData.size === 0) return "";

    // Agrupar dados
    const agrupados = new Map<number, number>();
    
    if (viewMode === "day") {
      // Usar horas diretamente (0-23)
      accountData.forEach((valor, hora) => {
        const atual = agrupados.get(hora) || 0;
        agrupados.set(hora, atual + valor);
      });
    } else {
      // Usar dias diretamente
      accountData.forEach((valor, dia) => {
        agrupados.set(dia, valor);
      });
    }

    const keys = Array.from(agrupados.keys()).sort((a, b) => a - b);
    if (keys.length === 0) return "";

    const points: { x: number; y: number }[] = [];

    keys.forEach((key) => {
      const valor = agrupados.get(key) || 0;
      // Para modo mês: dia 1 = 0%, último dia = 100%
      // Para modo dia: usa intervalos de 2h
      const x = viewMode === "month" 
        ? ((key - 1) / Math.max(daysInMonth - 1, 1)) * 100
        : (key / maxXValue) * 100;
      const y = Math.max(10, 100 - (valor / maxValue) * 80);
      points.push({ x, y });
    });

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
    }

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setViewMode("day");
      setPickerMode("day");
      setCalendarOpen(false);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(new Date(), pickerYear), monthIndex);
    setSelectedDate(newDate);
    setViewMode("month");
    setPickerMode("month");
    setCalendarOpen(false);
  };

  // Sincroniza pickerMode quando abre o calendário
  const handleCalendarOpenChange = (open: boolean) => {
    if (open) {
      setPickerMode(viewMode);
      setPickerYear(selectedDate.getFullYear());
    }
    setCalendarOpen(open);
  };

  // Limites de período disponível (5 meses para trás)
  const today = new Date();
  const minDate = useMemo(() => {
    const min = new Date(today);
    min.setMonth(min.getMonth() - 5);
    min.setDate(1);
    return min;
  }, []);
  
  const minYear = minDate.getFullYear();
  const minMonth = minDate.getMonth();
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();

  // Verificar se um mês está disponível para seleção
  const isMonthAvailable = (year: number, monthIndex: number): boolean => {
    const monthDate = new Date(year, monthIndex, 1);
    const minCheck = new Date(minYear, minMonth, 1);
    const maxCheck = new Date(maxYear, maxMonth, 1);
    return monthDate >= minCheck && monthDate <= maxCheck;
  };

  // Verificar se pode navegar para ano anterior/próximo
  const canGoPrevYear = pickerYear > minYear;
  const canGoNextYear = pickerYear < maxYear;

  // Componente de seletor de mês
  const MonthPicker = () => (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setPickerYear(prev => prev - 1)}
          disabled={!canGoPrevYear}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">{pickerYear}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setPickerYear(prev => prev + 1)}
          disabled={!canGoNextYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_PT.map((month, index) => {
          const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === pickerYear;
          const isAvailable = isMonthAvailable(pickerYear, index);
          return (
            <Button
              key={month}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleMonthSelect(index)}
              disabled={!isAvailable}
            >
              {month}/{pickerYear.toString().slice(-2)}
            </Button>
          );
        })}
      </div>
    </div>
  );

  // Gerar labels do eixo X
  const xAxisLabels = useMemo(() => {
    if (viewMode === "day") {
      return Array.from({ length: 24 }, (_, i) => `${i}h`);
    } else {
      // Para mês, mostrar todos os dias de 1 até o último dia do mês
      return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    }
  }, [viewMode, daysInMonth]);

  const dateLabel = viewMode === "day" 
    ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
    : format(selectedDate, "MMMM yyyy", { locale: ptBR });

  if (accounts.length === 0) {
    return (
      <div className="h-full bg-background border border-border rounded-xl p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-sm text-foreground font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tendência de vendas {viewMode === "day" ? "por hora" : "por dia"}
          </h3>
          <Popover open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex gap-2 p-2 border-b">
                <Button 
                  size="sm" 
                  variant={pickerMode === "day" ? "default" : "outline"}
                  onClick={() => setPickerMode("day")}
                >
                  Dia
                </Button>
                <Button 
                  size="sm" 
                  variant={pickerMode === "month" ? "default" : "outline"}
                  onClick={() => setPickerMode("month")}
                >
                  Mês
                </Button>
              </div>
              {pickerMode === "day" ? (
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  fromDate={minDate}
                  toDate={today}
                />
              ) : (
                <MonthPicker />
              )}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
          Nenhuma venda em {dateLabel}
        </div>
      </div>
    );
  }

  const yLabels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  return (
    <div className="h-full bg-background border border-muted-foreground/30 rounded-xl p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-sm text-foreground font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Tendência de vendas {viewMode === "day" ? "por hora" : "por dia"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
          <Popover open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex gap-2 p-2 border-b">
                <Button 
                  size="sm" 
                  variant={pickerMode === "day" ? "default" : "outline"}
                  onClick={() => setPickerMode("day")}
                >
                  Dia
                </Button>
                <Button 
                  size="sm" 
                  variant={pickerMode === "month" ? "default" : "outline"}
                  onClick={() => setPickerMode("month")}
                >
                  Mês
                </Button>
              </div>
              {pickerMode === "day" ? (
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  fromDate={minDate}
                  toDate={today}
                />
              ) : (
                <MonthPicker />
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="flex">
        {/* Eixo Y */}
        <div className="flex flex-col justify-between h-[210px] pr-2 text-xs text-muted-foreground">
          {yLabels.map((val, i) => (
            <span key={i}>{formatCurrency(val)}</span>
          ))}
        </div>
        
        {/* Gráfico */}
        <div 
          className="flex-1 relative h-[210px]"
          onMouseLeave={() => setTooltip(null)}
        >
          
          {/* Grid horizontal */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-border/40 w-full" />
            ))}
          </div>
          
          {/* Grid vertical */}
          <div className="absolute inset-0 flex justify-between pointer-events-none">
            {xAxisLabels.map((_, i) => (
              <div key={i} className="border-l border-border/40 h-full" />
            ))}
          </div>
          
          {/* Linha vertical tracejada ao hover */}
          {tooltip && (
            <div 
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-muted-foreground/50 pointer-events-none z-20"
              style={{ left: `${tooltip.xPercent}%` }}
            />
          )}
          
          {/* SVG com linhas */}
          <svg 
            className="absolute inset-0 w-full h-full overflow-visible" 
            viewBox="-2 -10 104 120" 
            preserveAspectRatio="none"
          >
            {filteredAccounts.map((account, index) => (
              <path
                key={account}
                d={generatePath(account)}
                fill="none"
                stroke={getAccountColor(account, index)}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          
          {/* Pontos nos dados - circles maiores no hover */}
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            const agrupados = new Map<number, number>();
            
            if (viewMode === "day") {
              accountData.forEach((valor, hora) => {
                const atual = agrupados.get(hora) || 0;
                agrupados.set(hora, atual + valor);
              });
            } else {
              accountData.forEach((valor, dia) => {
                agrupados.set(dia, valor);
              });
            }
            
            return Array.from(agrupados.entries()).map(([key, valor]) => {
              const xPercent = viewMode === "month" 
                ? ((key - 1) / Math.max(daysInMonth - 1, 1)) * 100
                : (key / maxXValue) * 100;
              const yPercent = Math.max(10, 100 - (valor / maxValue) * 80);
              const color = getAccountColor(account, accIndex);
              const isHovered = tooltip?.xIndex === key;
              
              return (
                <div
                  key={`${account}-${key}`}
                  className={cn(
                    "absolute rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-150",
                    isHovered ? "w-4 h-4 ring-2 ring-background opacity-100" : "w-2 h-2 opacity-0"
                  )}
                  style={{ 
                    left: `${xPercent}%`, 
                    top: `${yPercent}%`,
                    backgroundColor: color
                  }}
                />
              );
            });
          })}
          
          {/* Zonas de hover invisíveis por coluna X */}
          {xAxisLabels.map((label, index) => {
            // Calcular xPercent baseado no index
            let xKey: number;
            let xPercent: number;
            
            if (viewMode === "day") {
              xKey = index; // 0, 1, 2, 3... 23
              xPercent = (xKey / maxXValue) * 100;
            } else {
              xKey = index + 1; // 1, 2, 3...
              xPercent = (index / Math.max(daysInMonth - 1, 1)) * 100;
            }
            
            // Coletar dados de todas contas para este ponto X
            const accountsData = filteredAccounts
              .map((account, accIndex) => {
                const accountMap = chartData.get(account);
                if (!accountMap) return null;
                
                let valor = 0;
                if (viewMode === "day") {
                  // Valor direto da hora
                  valor = accountMap.get(xKey) || 0;
                } else {
                  valor = accountMap.get(xKey) || 0;
                }
                
                if (valor === 0) return null;
                
                return {
                  name: account,
                  valor,
                  color: getAccountColor(account, accIndex)
                };
              })
              .filter(Boolean) as Array<{ name: string; valor: number; color: string }>;
            
            if (accountsData.length === 0) return null;
            
            return (
              <div
                key={`hover-zone-${index}`}
                className="absolute top-0 bottom-0 cursor-crosshair"
                style={{ 
                  left: `${Math.max(0, xPercent - (50 / xAxisLabels.length))}%`,
                  width: `${100 / xAxisLabels.length}%`
                }}
                onMouseEnter={() => {
                  setTooltip({
                    xIndex: xKey,
                    xLabel: viewMode === 'month' ? `Dia ${label}` : label,
                    accounts: accountsData,
                    xPercent
                  });
                }}
              />
            );
          })}
          
          {/* Tooltip multi-conta customizado */}
          {tooltip && tooltip.accounts.length > 0 && (
            <div 
              className="absolute z-50 pointer-events-none bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1.5 px-2"
              style={{
                left: `${tooltip.xPercent}%`,
                top: '50%',
                transform: `translate(${tooltip.xPercent > 70 ? 'calc(-100% - 15px)' : '15px'}, -50%)`
              }}
            >
              {/* Label do eixo X destacado */}
              <div className="text-white font-medium text-xs mb-1.5 text-center whitespace-nowrap">
                {tooltip.xLabel}
              </div>
              
              {/* Dados de cada conta */}
              <div className="space-y-1">
                {tooltip.accounts.map((acc, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="text-zinc-300 text-xs whitespace-nowrap">
                      {formatCurrency(acc.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Eixo X dinâmico com destaque ao hover */}
      <div className="flex justify-between mt-2 ml-12 text-xs text-muted-foreground">
        {xAxisLabels.map((label, i) => {
          let xKey: number;
          if (viewMode === "day") {
            xKey = i * 2;
          } else {
            xKey = i + 1;
          }
          const isHovered = tooltip?.xIndex === xKey;
          
          return (
            <span 
              key={i} 
              className={cn(
                "transition-all duration-150 px-1 py-0.5 rounded",
                isHovered && "bg-zinc-900 text-white font-medium"
              )}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
