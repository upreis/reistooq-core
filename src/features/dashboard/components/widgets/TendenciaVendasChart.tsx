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
  "#3b82f6", // blue
  "#ec4899", // pink
  "#22c55e", // green
  "#f97316", // orange
  "#a855f7", // purple
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

  // Gerar path SVG com linhas retas (mais confiável)
  const generatePath = (accountName: string): string => {
    const accountData = chartData.get(accountName);
    if (!accountData || accountData.size === 0) return "";

    const horas = Array.from(accountData.keys()).sort((a, b) => a - b);
    if (horas.length === 0) return "";

    const points: { x: number; y: number }[] = [];

    horas.forEach((hora) => {
      const valor = accountData.get(hora) || 0;
      const x = (hora / 23) * 100;
      const y = Math.max(5, 100 - (valor / maxValue) * 90); // Deixa margem de 5-95%
      points.push({ x, y });
    });

    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
    }

    // Linha simples conectando pontos
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  };

  if (accounts.length === 0) {
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

  // Gerar labels do eixo Y (usar spread para não mutar)
  const yLabels = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];

  return (
    <div className="md:col-span-2 md:row-span-2 bg-background border border-border rounded-xl p-4">
      <h3 className="font-serif text-lg text-foreground font-medium mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Tendência de vendas por hora
      </h3>
      
      <div className="flex">
        {/* Eixo Y */}
        <div className="flex flex-col justify-between h-[200px] pr-2 text-[10px] text-muted-foreground">
          {yLabels.map((val, i) => (
            <span key={i}>{formatCurrency(val)}</span>
          ))}
        </div>
        
        {/* Gráfico */}
        <div className="flex-1 relative h-[200px]">
          {/* Grid horizontal */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-border/30 w-full" />
            ))}
          </div>
          
          {/* SVG com linhas */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {filteredAccounts.map((account, index) => (
              <path
                key={account}
                d={generatePath(account)}
                fill="none"
                stroke={COLORS[index % COLORS.length]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          
          {/* Pontos - usando divs para manter formato redondo */}
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            return Array.from(accountData.entries()).map(([hora, valor]) => {
              const xPercent = (hora / 23) * 100;
              const yPercent = 100 - (valor / maxValue) * 100;
              return (
                <div
                  key={`${account}-${hora}`}
                  className="absolute w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${xPercent}%`, 
                    top: `${yPercent}%`,
                    backgroundColor: COLORS[accIndex % COLORS.length]
                  }}
                  title={`${account}: ${formatCurrency(valor)} às ${hora}h`}
                />
              );
            });
          })}
        </div>
      </div>
      
      {/* Eixo X */}
      <div className="flex justify-between mt-2 ml-12 text-[10px] text-muted-foreground">
        {[0, 4, 8, 12, 16, 20, 23].map((hora) => (
          <span key={hora}>{hora}h</span>
        ))}
      </div>
    </div>
  );
}
