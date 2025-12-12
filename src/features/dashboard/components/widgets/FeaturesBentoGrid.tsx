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

const TIMEZONE = 'America/Sao_Paulo';

const ACCOUNT_COLORS: Record<string, string> = {
  "BRCR20240514161447": "border-blue-500 bg-blue-500",
  "PLATINUMLOJA2020": "border-pink-500 bg-pink-500",
  "UNIVERSOMELI": "border-green-500 bg-green-500",
  "HORE20240106205039": "border-orange-500 bg-orange-500",
  "LOJAOITO": "border-purple-500 bg-purple-500",
  "LUTHORSHOPLTDA": "border-cyan-500 bg-cyan-500",
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

  // Fetch ALL available accounts (últimos 60 dias) - independente do período selecionado
  const { data: accounts = [] } = useQuery({
    queryKey: ["vendas-accounts-all"],
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

      // Buscar contas dos últimos 60 dias (todas disponíveis)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data, error } = await supabase
        .from("vendas_hoje_realtime")
        .select("account_name")
        .eq("organization_id", profile.organizacao_id)
        .gte("date_created", sixtyDaysAgo.toISOString());

      if (error) throw error;
      
      const uniqueAccounts = [...new Set((data || []).map(d => d.account_name).filter(Boolean))];
      return uniqueAccounts as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
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
      <div className="flex gap-2 items-center flex-wrap py-3 px-4 bg-background/50 rounded-lg border border-muted-foreground/30">
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

      {/* Mapa do Brasil + Cards de Estoque */}
      <div className="flex gap-4">
        {/* Mapa do Brasil - Largura fixa menor */}
        <div className="w-[55%] h-[620px]">
          <BrazilSalesMap selectedAccount={selectedAccount} dateRange={dateRange} />
        </div>

        {/* Cards de Estoque com 3 modos de exibição - um abaixo do outro */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Estoque Alto */}
          {stockLoading ? (
            <div className="flex items-center justify-center w-[200px] h-[240px] bg-background rounded-lg border border-muted-foreground/30">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ProductStockMorphingCard 
              products={highStockProducts}
              title="Estoque Alto"
              type="high"
            />
          )}

          {/* Estoque Baixo */}
          {stockLoading ? (
            <div className="flex items-center justify-center w-[200px] h-[240px] bg-background rounded-lg border border-muted-foreground/30">
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
