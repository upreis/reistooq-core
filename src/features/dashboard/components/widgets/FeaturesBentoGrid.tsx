import { useState, useMemo } from "react";
import { VendasHojeCard } from "./VendasHojeCard";
import { TendenciaVendasChart } from "./TendenciaVendasChart";
import { QuickActionCards } from "./QuickActionCards";
import { BrazilSalesMap } from "./BrazilSalesMap";
import { ProductStockMorphingCard } from "@/components/dashboard/ProductStockMorphingCard";
import { useEstoqueProducts } from "@/hooks/useEstoqueProducts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay, getYear, getMonth } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEZONE = 'America/Sao_Paulo';

// Cores com estilo StatusBadge - fundo transparente com borda colorida
const ACCOUNT_COLORS: Record<string, { border: string; bg: string; text: string; activeBg: string }> = {
  "BRCR20240514161447": {
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    activeBg: "bg-blue-500/30"
  },
  "IG20251024151201": {
    border: "border-sky-500/50",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    activeBg: "bg-sky-500/30"
  },
  "PLATINUMLOJA2020": {
    border: "border-pink-500/50",
    bg: "bg-pink-500/10",
    text: "text-pink-400",
    activeBg: "bg-pink-500/30"
  },
  "UNIVERSOMELI": {
    border: "border-green-500/50",
    bg: "bg-green-500/10",
    text: "text-green-400",
    activeBg: "bg-green-500/30"
  },
  "HORE20240106205039": {
    border: "border-orange-500/50",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    activeBg: "bg-orange-500/30"
  },
  "LOJAOITO": {
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    activeBg: "bg-purple-500/30"
  },
  "LUTHORSHOPLTDA": {
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    activeBg: "bg-cyan-500/30"
  },
  "MSMARKETSTORE": {
    border: "border-rose-500/50",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    activeBg: "bg-rose-500/30"
  },
};

export type ViewMode = "day" | "month";

export function FeaturesBentoGrid() {
  const [selectedAccount, setSelectedAccount] = useState<string>("todas");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const { highStockProducts, lowStockProducts, loading: stockLoading } = useEstoqueProducts();

  // Calcular range de datas baseado no viewMode - memoizado para evitar re-renders
  // IMPORTANTE: usar timezone São Paulo para calcular início/fim do mês corretamente
  const dateRange = useMemo(() => {
    // Converter para timezone São Paulo primeiro
    const zonedDate = toZonedTime(selectedDate, TIMEZONE);
    
    if (viewMode === "day") {
      return { start: startOfDay(zonedDate), end: endOfDay(zonedDate) };
    }
    
    // Para mês, criar datas explícitas no timezone correto
    const year = getYear(zonedDate);
    const month = getMonth(zonedDate);
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return { start: monthStart, end: monthEnd };
  }, [viewMode, selectedDate.getTime()]);

  // Fetch ALL integration accounts (diretamente da tabela de integrações)
  // IMPORTANTE: Usa apenas a RLS do Supabase para garantir que todas as contas da org apareçam
  const { data: accounts = [] } = useQuery({
    queryKey: ["integration-accounts-dashboard"],
    queryFn: async () => {
      // Buscar TODAS as contas ativas - a RLS já filtra por organização
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("[FeaturesBentoGrid] Error fetching accounts:", error);
        throw error;
      }
      
      const uniqueAccounts = [...new Set((data || []).map(d => d.name).filter(Boolean))];
      console.log("[FeaturesBentoGrid] Loaded accounts:", uniqueAccounts);
      return uniqueAccounts as string[];
    },
    staleTime: 10 * 1000, // 10 segundos para ver novas contas mais rápido
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const getAccountColors = (account: string, isActive: boolean) => {
    const colorKey = Object.keys(ACCOUNT_COLORS).find(key => 
      account.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(account.toLowerCase())
    );
    
    const colors = colorKey 
      ? ACCOUNT_COLORS[colorKey] 
      : { 
          border: "border-gray-500/50", 
          bg: "bg-gray-500/10", 
          text: "text-gray-400",
          activeBg: "bg-gray-500/30"
        };
    
    return {
      className: cn(
        "border",
        colors.border,
        colors.text,
        isActive ? colors.activeBg : colors.bg,
        !isActive && "hover:opacity-80"
      ),
      textColor: colors.text
    };
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex gap-2 items-center flex-wrap py-3 px-4 bg-background/80 rounded-lg border border-muted-foreground/20">
        <span className="text-xs text-muted-foreground font-medium">Filtrar por:</span>
        <button
          onClick={() => setSelectedAccount("todas")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
            selectedAccount === "todas"
              ? "bg-yellow-500/30 text-yellow-400 border-yellow-500/50"
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20"
          )}
        >
          Todos
        </button>
        {accounts.map((account) => {
          const { className } = getAccountColors(account, selectedAccount === account);
          return (
            <button
              key={account}
              onClick={() => setSelectedAccount(account)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                className
              )}
            >
              <Store className="w-3 h-3" />
              {account}
            </button>
          );
        })}
      </div>

      {/* Layout: Vendas + Produtos | Gráfico */}
      <div className="flex gap-4">
        {/* Coluna esquerda: Card de Vendas em cima + Produtos abaixo - 35% da largura */}
        <div className="flex flex-col gap-3 w-[35%]">
          <VendasHojeCard 
            selectedAccount={selectedAccount} 
            dateRange={dateRange}
            viewMode={viewMode}
          />
          <div className="flex-1">
            <QuickActionCards selectedAccount={selectedAccount} dateRange={dateRange} />
          </div>
        </div>
        
        {/* Gráfico de Tendência ao lado - 65% da largura */}
        <div className="w-[65%]">
          <TendenciaVendasChart 
            selectedAccount={selectedAccount}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>
      </div>

      {/* Mapa do Brasil */}
      <div className="h-[620px]">
        <BrazilSalesMap selectedAccount={selectedAccount} dateRange={dateRange} />
      </div>

      {/* Cards de Estoque - lado a lado */}
      <div className="flex gap-4">
        {/* Estoque Alto */}
        <div className="flex-1 rounded-xl border border-muted-foreground/30 bg-card p-4">
          {stockLoading ? (
            <div className="flex items-center justify-center h-[320px] bg-background rounded-lg border border-muted-foreground/20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ProductStockMorphingCard 
              products={highStockProducts}
              title="Estoque Alto"
              type="high"
            />
          )}
        </div>

        {/* Estoque Baixo */}
        <div className="flex-1 rounded-xl border border-muted-foreground/30 bg-card p-4">
          {stockLoading ? (
            <div className="flex items-center justify-center h-[320px] bg-background rounded-lg border border-muted-foreground/20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ProductStockMorphingCard 
              products={lowStockProducts}
              title="Estoque Baixo"
              type="low"
            />
          )}
        </div>
      </div>
    </div>
  );
}
