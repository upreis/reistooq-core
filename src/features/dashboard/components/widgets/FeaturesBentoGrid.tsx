import { useState } from "react";
import { VendasHojeCard } from "./VendasHojeCard";
import { TendenciaVendasChart } from "./TendenciaVendasChart";
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

export function FeaturesBentoGrid() {
  const [selectedAccount, setSelectedAccount] = useState<string>("todas");

  // Fetch available accounts from vendas_hoje_realtime
  const { data: accounts = [] } = useQuery({
    queryKey: ["vendas-hoje-accounts"],
    queryFn: async () => {
      const hoje = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("account_name")
        .gte("date_created", hoje);

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

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">
        {/* 1. Vendas de Hoje ao Vivo */}
        <VendasHojeCard selectedAccount={selectedAccount} />

        {/* 2. Tendência de Vendas - Expandido (4x2) */}
        <TendenciaVendasChart selectedAccount={selectedAccount} />
      </div>
    </div>
  );
}
