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

  const { chartData, maxValue, accounts, allHoras } = useMemo(() => {
    if (!vendas || vendas.length === 0) {
      return { chartData: new Map(), maxValue: 0, accounts: [], allHoras: [] };
    }

    const accountsSet = new Set<string>();
    // Map: account -> Map<hora, valor>
    const chartData = new Map<string, Map<string, number>>();

    vendas.forEach((venda) => {
      const accountName = venda.account_name || "Desconhecido";
      accountsSet.add(accountName);

      const dateStr = venda.date_created || venda.created_at;
      if (!dateStr) return;
      
      const date = new Date(dateStr);
      const hora = date.getHours().toString().padStart(2, "0");
      const valor = Number(venda.total_amount) || 0;

      if (!chartData.has(accountName)) {
        chartData.set(accountName, new Map());
      }
      
      const accountData = chartData.get(accountName)!;
      const current = accountData.get(hora) || 0;
      accountData.set(hora, current + valor);
    });

    const accounts = Array.from(accountsSet);
    
    // Coletar todas as horas únicas
    const horasSet = new Set<string>();
    chartData.forEach((accountMap) => {
      accountMap.forEach((_, hora) => horasSet.add(hora));
    });
    const allHoras = Array.from(horasSet).sort((a, b) => parseInt(a) - parseInt(b));

    // Calcular máximo
    let maxValue = 1;
    chartData.forEach((accountMap) => {
      accountMap.forEach((valor) => {
        if (valor > maxValue) maxValue = valor;
      });
    });

    return { chartData, maxValue, accounts, allHoras };
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

  if (allHoras.length === 0) {
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
      
      {/* Gráfico de linhas por conta */}
      <div className="relative h-[220px] w-full">
        {/* Grid de fundo */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-border/30 w-full" />
          ))}
        </div>
        
        {/* SVG para linhas */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            const points = allHoras.map((hora, horaIndex) => {
              const valor = accountData.get(hora) || 0;
              const x = (horaIndex / (allHoras.length - 1 || 1)) * 100;
              const y = 100 - (valor / maxValue) * 100;
              return `${x},${y}`;
            }).join(" ");
            
            return (
              <polyline
                key={account}
                points={points}
                fill="none"
                stroke={COLORS[accIndex % COLORS.length]}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          
          {/* Pontos */}
          {filteredAccounts.map((account, accIndex) => {
            const accountData = chartData.get(account);
            if (!accountData) return null;
            
            return allHoras.map((hora, horaIndex) => {
              const valor = accountData.get(hora) || 0;
              if (valor === 0) return null;
              const x = (horaIndex / (allHoras.length - 1 || 1)) * 100;
              const y = 100 - (valor / maxValue) * 100;
              return (
                <g key={`${account}-${hora}`} className="group">
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={COLORS[accIndex % COLORS.length]}
                    className="cursor-pointer hover:r-6"
                  />
                  <title>{`${account}: ${formatCurrency(valor)} às ${hora}h`}</title>
                </g>
              );
            });
          })}
        </svg>
      </div>
      
      {/* Labels das horas */}
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground px-1">
        {allHoras.map((hora) => (
          <span key={hora}>{hora}h</span>
        ))}
      </div>
    </div>
  );
}
