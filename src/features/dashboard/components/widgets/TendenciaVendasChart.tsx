import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  hora: number;
  x: number;
  y: number;
  color: string;
}

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
  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-hoje-tendencia"],
    queryFn: async () => {
      // Início de hoje em UTC (São Paulo é UTC-3)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("*")
        .gte("date_created", startOfToday.toISOString())
        .lte("date_created", endOfToday.toISOString());

      if (error) throw error;
      return (data || []) as VendaRealtime[];
    },
    refetchInterval: 60000,
  });

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
      const hora = date.getHours();
      const valor = Number(venda.total_amount) || 0;

      if (!chartData.has(accountName)) {
        chartData.set(accountName, new Map());
      }
      
      const accountData = chartData.get(accountName)!;
      const current = accountData.get(hora) || 0;
      accountData.set(hora, current + valor);
    });

    const accounts = Array.from(accountsSet);
    
    let maxValue = 1;
    chartData.forEach((accountMap) => {
      accountMap.forEach((valor) => {
        if (valor > maxValue) maxValue = valor;
      });
    });

    return { chartData, maxValue, accounts };
  }, [vendas]);

  const filteredAccounts = selectedAccount === "todas" 
    ? accounts 
    : accounts.filter(a => a === selectedAccount);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  // Gerar path SVG com curvas suaves (bezier) - intervalos de 2h
  const generatePath = (accountName: string): string => {
    const accountData = chartData.get(accountName);
    if (!accountData || accountData.size === 0) return "";

    // Agrupar por intervalos de 2 horas
    const horasAgrupadas = new Map<number, number>();
    accountData.forEach((valor, hora) => {
      const intervalo = Math.floor(hora / 2) * 2; // 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22
      const atual = horasAgrupadas.get(intervalo) || 0;
      horasAgrupadas.set(intervalo, atual + valor);
    });

    const intervalos = Array.from(horasAgrupadas.keys()).sort((a, b) => a - b);
    if (intervalos.length === 0) return "";

    const points: { x: number; y: number }[] = [];

    intervalos.forEach((intervalo) => {
      const valor = horasAgrupadas.get(intervalo) || 0;
      const x = (intervalo / 22) * 100; // 22 é o último intervalo (22h-24h)
      const y = Math.max(10, 100 - (valor / maxValue) * 80); // Mais margem no topo
      points.push({ x, y });
    });

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
    }

    // Criar curva suave usando cubic bezier
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Calcular pontos de controle para curva suave (Catmull-Rom to Bezier)
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };

  if (accounts.length === 0) {
    return (
      <div className="md:col-span-4 md:row-span-1 bg-background border border-border rounded-xl p-3 overflow-hidden">
        <h3 className="font-serif text-sm text-foreground font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Tendência de vendas por hora
        </h3>
        <div className="flex items-center justify-center h-[100px] text-muted-foreground text-sm">
          Nenhuma venda hoje ainda
        </div>
      </div>
    );
  }

  // Gerar labels do eixo Y (usar spread para não mutar)
  const yLabels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  return (
    <div className="md:col-span-3 md:row-span-1 bg-background border border-border rounded-xl p-3 overflow-hidden">
      <h3 className="font-serif text-sm text-foreground font-medium mb-2 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        Tendência de vendas por hora
      </h3>
      
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
          
          {/* Pontos interativos - agrupados por 2h */}
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            // Agrupar por intervalos de 2 horas para os pontos também
            const horasAgrupadas = new Map<number, number>();
            accountData.forEach((valor, hora) => {
              const intervalo = Math.floor(hora / 2) * 2;
              const atual = horasAgrupadas.get(intervalo) || 0;
              horasAgrupadas.set(intervalo, atual + valor);
            });
            
            return Array.from(horasAgrupadas.entries()).map(([intervalo, valor]) => {
              const xPercent = (intervalo / 22) * 100;
              const yPercent = Math.max(10, 100 - (valor / maxValue) * 80); // Mesma fórmula do path
              const color = getAccountColor(account, accIndex);
              
              return (
                <div
                  key={`${account}-${intervalo}`}
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
                        hora: intervalo,
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
                {formatCurrency(tooltip.valor)} ({tooltip.hora}h - {tooltip.hora + 2}h)
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Eixo X - intervalos de 2h */}
      <div className="flex justify-between mt-2 ml-12 text-[10px] text-muted-foreground">
        {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map((hora) => (
          <span key={hora}>{hora}h</span>
        ))}
      </div>
    </div>
  );
}
