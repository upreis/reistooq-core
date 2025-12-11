import { useMemo, useState } from "react";
import { TrendingUp, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, getDaysInMonth, startOfDay, endOfDay, setMonth, setYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}

interface TooltipData {
  account: string;
  valor: number;
  label: string;
  x: number;
  y: number;
  color: string;
}

type ViewMode = "day" | "month";

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

export function TendenciaVendasChart({ selectedAccount = "todas" }: TendenciaVendasChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());

  const { startDate, endDate } = useMemo(() => {
    if (viewMode === "day") {
      return {
        startDate: startOfDay(selectedDate),
        endDate: endOfDay(selectedDate)
      };
    } else {
      return {
        startDate: startOfMonth(selectedDate),
        endDate: endOfMonth(selectedDate)
      };
    }
  }, [selectedDate, viewMode]);

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-tendencia", startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("*")
        .gte("date_created", startDate.toISOString())
        .lte("date_created", endDate.toISOString());

      if (error) throw error;
      return (data || []) as VendaRealtime[];
    },
    refetchInterval: 60000,
  });

  const daysInMonth = getDaysInMonth(selectedDate);
  const maxXValue = viewMode === "day" ? 22 : daysInMonth;

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
      // Agrupar por intervalos de 2 horas
      accountData.forEach((valor, hora) => {
        const intervalo = Math.floor(hora / 2) * 2;
        const atual = agrupados.get(intervalo) || 0;
        agrupados.set(intervalo, atual + valor);
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
      setCalendarOpen(false);
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(new Date(), pickerYear), monthIndex);
    setSelectedDate(newDate);
    setViewMode("month");
    setCalendarOpen(false);
  };

  // Componente de seletor de mês
  const MonthPicker = () => (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setPickerYear(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">{pickerYear}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={() => setPickerYear(prev => prev + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MONTHS_PT.map((month, index) => {
          const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === pickerYear;
          return (
            <Button
              key={month}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => handleMonthSelect(index)}
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
      return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => `${h}h`);
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
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex gap-2 p-2 border-b">
                <Button 
                  size="sm" 
                  variant={viewMode === "day" ? "default" : "outline"}
                  onClick={() => setViewMode("day")}
                >
                  Dia
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === "month" ? "default" : "outline"}
                  onClick={() => setViewMode("month")}
                >
                  Mês
                </Button>
              </div>
              {viewMode === "day" ? (
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
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
    <div className="h-full bg-background border border-border rounded-xl p-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif text-sm text-foreground font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Tendência de vendas {viewMode === "day" ? "por hora" : "por dia"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Calendar className="h-4 w-4 text-primary" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex gap-2 p-2 border-b">
                <Button 
                  size="sm" 
                  variant={viewMode === "day" ? "default" : "outline"}
                  onClick={() => setViewMode("day")}
                >
                  Dia
                </Button>
                <Button 
                  size="sm" 
                  variant={viewMode === "month" ? "default" : "outline"}
                  onClick={() => setViewMode("month")}
                >
                  Mês
                </Button>
              </div>
              {viewMode === "day" ? (
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
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
        <div className="flex flex-col justify-between h-[210px] pr-2 text-[10px] text-muted-foreground">
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
              <div key={i} className="border-t border-border/30 w-full" />
            ))}
          </div>
          
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
          
          {/* Pontos interativos */}
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            const agrupados = new Map<number, number>();
            
            if (viewMode === "day") {
              accountData.forEach((valor, hora) => {
                const intervalo = Math.floor(hora / 2) * 2;
                const atual = agrupados.get(intervalo) || 0;
                agrupados.set(intervalo, atual + valor);
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
              const label = viewMode === "day" ? `${key}h - ${key + 2}h` : `Dia ${key}`;
              
              return (
                <div
                  key={`${account}-${key}`}
                  className="absolute w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ 
                    left: `${xPercent}%`, 
                    top: `${yPercent}%`,
                    backgroundColor: color
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                    if (rect) {
                      setTooltip({
                        account,
                        valor,
                        label,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        color
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            });
          })}
          
          {/* Tooltip customizado */}
          {tooltip && (
            <div 
              className="absolute z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-lg p-2 text-sm"
              style={{
                left: tooltip.x + 10,
                top: tooltip.y - 40,
                transform: tooltip.x > 200 ? 'translateX(-100%)' : 'none'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: tooltip.color }}
                />
                <span className="font-medium text-foreground truncate max-w-[150px]">
                  {tooltip.account}
                </span>
              </div>
              <div className="text-muted-foreground">
                {formatCurrency(tooltip.valor)} ({tooltip.label})
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Eixo X dinâmico */}
      <div className="flex justify-between mt-2 ml-12 text-[10px] text-muted-foreground">
        {xAxisLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}
