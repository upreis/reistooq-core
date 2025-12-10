import React, { useMemo } from "react";
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

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(340, 82%, 52%)", // pink
  "hsl(142, 71%, 45%)", // green
  "hsl(38, 92%, 50%)",  // orange
  "hsl(262, 83%, 58%)", // purple
];

export function TendenciaVendasChart({ selectedAccount = "todas" }: TendenciaVendasChartProps) {
  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas-hoje-tendencia"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("*")
        .gte("date_created", hoje);

      if (error) throw error;
      return (data || []) as VendaRealtime[];
    },
    refetchInterval: 60000,
  });

  const { chartData, maxValue, filteredAccounts } = useMemo(() => {
    if (!vendas || vendas.length === 0) {
      return { chartData: [], maxValue: 0, filteredAccounts: [] };
    }

    const accountsSet = new Set<string>();
    const horaMap = new Map<string, Map<string, number>>();

    vendas.forEach((venda) => {
      const accountName = venda.account_name || "Desconhecido";
      accountsSet.add(accountName);

      const dateStr = venda.date_created || venda.created_at;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      const hora = date.getHours().toString().padStart(2, "0");
      const valor = Number(venda.total_amount) || 0;

      if (!horaMap.has(hora)) {
        horaMap.set(hora, new Map());
      }
      
      const horaData = horaMap.get(hora)!;
      const current = horaData.get(accountName) || 0;
      horaData.set(accountName, current + valor);
    });

    const accounts = Array.from(accountsSet);
    const filteredAccounts = selectedAccount === "todas" 
      ? accounts 
      : accounts.filter(a => a === selectedAccount);

    // Criar array de horas ordenadas
    const horas = Array.from(horaMap.keys()).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Criar dados por hora COM valores separados por conta
    const chartData = horas.map(hora => {
      const horaData = horaMap.get(hora)!;
      const accountValues: Record<string, number> = {};
      filteredAccounts.forEach(account => {
        accountValues[account] = horaData.get(account) || 0;
      });
      return { hora: `${hora}h`, ...accountValues };
    });

    // Calcular máximo considerando todas as contas
    let maxValue = 1;
    chartData.forEach(item => {
      filteredAccounts.forEach(account => {
        const val = (item as Record<string, number | string>)[account] as number || 0;
        if (val > maxValue) maxValue = val;
      });
    });

    return { chartData, maxValue, filteredAccounts };
  }, [vendas, selectedAccount]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="md:col-span-2 md:row-span-2 bg-background border border-border rounded-xl p-4">
        <h3 className="font-serif text-lg text-foreground font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendência de vendas por hora
        </h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          Nenhuma venda hoje ainda
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2 md:row-span-2 bg-background border border-border rounded-xl p-4">
      <h3 className="font-serif text-lg text-foreground font-medium mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Tendência de vendas por hora
      </h3>
      
      {/* Gráfico de barras CSS - agrupado por conta */}
      <div className="flex items-end gap-2 h-[200px] px-2">
        {chartData.map((item) => (
          <div 
            key={item.hora} 
            className="flex-1 flex flex-col items-center gap-1"
          >
            {/* Barras agrupadas por conta */}
            <div className="flex items-end gap-[2px] w-full h-full">
              {filteredAccounts.map((account, accIndex) => {
                const value = (item as Record<string, number | string>)[account] as number || 0;
                const heightPercent = (value / maxValue) * 100;
                return (
                  <div 
                    key={account}
                    className="flex-1 group relative"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-popover border border-border rounded px-2 py-1 shadow-lg whitespace-nowrap z-10">
                      <div className="font-medium">{account}</div>
                      <div>{formatCurrency(value)}</div>
                    </div>
                    {/* Barra */}
                    <div 
                      className="w-full rounded-t transition-all duration-300 hover:opacity-80 absolute bottom-0"
                      style={{ 
                        height: `${Math.max(heightPercent, 2)}%`,
                        backgroundColor: COLORS[accIndex % COLORS.length]
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Label da hora */}
            <span className="text-[10px] text-muted-foreground mt-1">
              {item.hora}
            </span>
          </div>
        ))}
      </div>

      {/* Legenda por conta */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border">
        {filteredAccounts.map((account, index) => (
          <div key={account} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="truncate max-w-[150px]">{account}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
