import { useState } from "react";
import { VendasHojeCard } from "./VendasHojeCard";
import { TendenciaVendasChart } from "./TendenciaVendasChart";
import { QuickActionCards } from "./QuickActionCards";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ACCOUNT_COLORS: Record<string, string> = {
  "BRCR20240514161447": "border-blue-500 bg-blue-500",
  "PLATINUMLOJA2020": "border-pink-500 bg-pink-500",
  "UNIVERSOMELI": "border-green-500 bg-green-500",
  "HORE20240106205039": "border-orange-500 bg-orange-500",
  "LOJAOITO": "border-purple-500 bg-purple-500",
  "LUTHORSHOPLTDA": "border-cyan-500 bg-cyan-500",
};

// Helper para obter início e fim do dia em São Paulo (UTC-3)
const getHojeRangeSaoPaulo = () => {
  const now = new Date();
  // São Paulo é UTC-3
  const offsetHours = 3;
  
  // Início do dia em São Paulo (00:00 SP = 03:00 UTC)
  const startOfDaySP = new Date(now);
  startOfDaySP.setUTCHours(offsetHours, 0, 0, 0);
  
  // Se a hora atual UTC for antes das 03:00, estamos ainda no dia anterior em SP
  if (now.getUTCHours() < offsetHours) {
    startOfDaySP.setUTCDate(startOfDaySP.getUTCDate() - 1);
  }
  
  // Fim do dia em São Paulo (23:59:59 SP = 02:59:59 UTC do dia seguinte)
  const endOfDaySP = new Date(startOfDaySP);
  endOfDaySP.setUTCDate(endOfDaySP.getUTCDate() + 1);
  endOfDaySP.setUTCMilliseconds(-1);
  
  return {
    start: startOfDaySP.toISOString(),
    end: endOfDaySP.toISOString()
  };
};

export function FeaturesBentoGrid() {
  const [selectedAccount, setSelectedAccount] = useState<string>("todas");

  // Fetch available accounts from vendas_hoje_realtime
  const { data: accounts = [] } = useQuery({
    queryKey: ["vendas-hoje-accounts"],
    queryFn: async () => {
      const { start, end } = getHojeRangeSaoPaulo();
      
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("account_name")
        .gte("date_created", start)
        .lte("date_created", end);

      if (error) throw error;
      
      const uniqueAccounts = [...new Set((data || []).map(d => d.account_name).filter(Boolean))];
      return uniqueAccounts as string[];
    },
    refetchInterval: 60000,
  });

  const getAccountColor = (account: string, isActive: boolean) => {
    const colorKey = Object.keys(ACCOUNT_COLORS).find(key => 
      account.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(account.toLowerCase())
    );
    const baseColor = colorKey ? ACCOUNT_COLORS[colorKey] : "border-gray-500 bg-gray-500";
    const [borderClass, bgClass] = baseColor.split(" ");
    
    if (isActive) {
      return `${bgClass} text-white ${borderClass}`;
    }
    return `bg-background ${borderClass} hover:bg-accent`;
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex gap-2 items-center flex-wrap py-3 px-4 bg-background/50 rounded-lg border border-border">
        <span className="text-xs text-muted-foreground font-medium">Filtrar por:</span>
        <button
          onClick={() => setSelectedAccount("todas")}
          className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all font-medium ${
            selectedAccount === "todas"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border hover:bg-accent"
          }`}
        >
          Todos
        </button>
        {accounts.map((account) => (
          <button
            key={account}
            onClick={() => setSelectedAccount(account)}
            className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all font-medium ${
              getAccountColor(account, selectedAccount === account)
            }`}
          >
            🏪 {account}
          </button>
        ))}
      </div>

      {/* Layout: Vendas + Produtos | Gráfico */}
      <div className="flex gap-4">
        {/* Coluna esquerda: Card de Vendas em cima + Produtos abaixo */}
        <div className="flex flex-col gap-3 w-[280px]">
          <VendasHojeCard selectedAccount={selectedAccount} />
          <div className="flex-1">
            <QuickActionCards selectedAccount={selectedAccount} />
          </div>
        </div>
        
        {/* Gráfico de Tendência ao lado */}
        <div className="flex-1">
          <TendenciaVendasChart selectedAccount={selectedAccount} />
        </div>
      </div>
    </div>
  );
}
