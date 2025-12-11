import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BRAZIL_STATES_SVG } from "./brazil-states-svg";

interface BrazilSalesMapProps {
  selectedAccount: string;
  dateRange: { start: Date; end: Date };
}

interface StateData {
  uf: string;
  vendas: number;
  valor: number;
}

// Função para calcular cor baseada na intensidade de vendas
function getStateColor(vendas: number, maxVendas: number): string {
  if (vendas === 0 || maxVendas === 0) return "hsl(var(--muted) / 0.4)";
  
  const intensity = Math.min(vendas / maxVendas, 1);
  // Gradiente de verde claro para verde escuro
  const lightness = 70 - (intensity * 40); // 70% -> 30%
  return `hsl(142, 76%, ${lightness}%)`;
}

export function BrazilSalesMap({ selectedAccount, dateRange }: BrazilSalesMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  // Buscar dados de vendas por estado
  const { data: salesByState = [], isLoading } = useQuery({
    queryKey: ["vendas-por-estado", selectedAccount, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) return [];

      // Buscar vendas do período com shipping_state
      let query = supabase
        .from("vendas_hoje_realtime")
        .select("order_id, total_amount, shipping_state, account_name")
        .eq("organization_id", profile.organizacao_id)
        .gte("date_created", dateRange.start.toISOString())
        .lte("date_created", dateRange.end.toISOString());

      if (selectedAccount !== "todas") {
        query = query.eq("account_name", selectedAccount);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agregar por estado usando coluna shipping_state
      const stateMap = new Map<string, { vendas: number; valor: number }>();
      
      (data || []).forEach((order: any) => {
        const state = order.shipping_state;
        if (!state) return;
        
        const current = stateMap.get(state) || { vendas: 0, valor: 0 };
        stateMap.set(state, {
          vendas: current.vendas + 1,
          valor: current.valor + (order.total_amount || 0),
        });
      });

      return Array.from(stateMap.entries()).map(([uf, data]) => ({
        uf,
        vendas: data.vendas,
        valor: data.valor,
      }));
    },
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000, // Refetch a cada 2 min para pegar estados enriquecidos
  });

  const maxVendas = useMemo(() => {
    return Math.max(...salesByState.map(s => s.vendas), 1);
  }, [salesByState]);

  const totalVendas = useMemo(() => {
    return salesByState.reduce((sum, s) => sum + s.vendas, 0);
  }, [salesByState]);

  const getStateData = (uf: string): StateData | undefined => {
    return salesByState.find(s => s.uf === uf);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const selectedStateData = selectedState ? getStateData(selectedState) : null;

  return (
    <Card className="border-muted-foreground/30 h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Carregando mapa...
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {/* Mapa SVG - Esquerda */}
            <TooltipProvider>
              <svg
                viewBox="0 0 612 640"
                className="w-[320px] h-full max-h-[460px] flex-shrink-0"
                preserveAspectRatio="xMidYMid meet"
              >
                {Object.entries(BRAZIL_STATES_SVG).map(([uf, { name, path }]) => {
                  const stateData = getStateData(uf);
                  const vendas = stateData?.vendas || 0;
                  const isHovered = hoveredState === uf;
                  const isSelected = selectedState === uf;
                  
                  return (
                    <Tooltip key={uf}>
                      <TooltipTrigger asChild>
                        <path
                          d={path}
                          fill={getStateColor(vendas, maxVendas)}
                          stroke={isSelected ? "hsl(var(--primary))" : isHovered ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.5)"}
                          strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.8}
                          className="cursor-pointer transition-all duration-200"
                          onMouseEnter={() => setHoveredState(uf)}
                          onMouseLeave={() => setHoveredState(null)}
                          onClick={() => setSelectedState(selectedState === uf ? null : uf)}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="font-semibold">{name} ({uf})</div>
                        <div>{vendas} vendas</div>
                        {stateData && <div>{formatCurrency(stateData.valor)}</div>}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </svg>
            </TooltipProvider>

            {/* Conteúdo - Direita */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Título e Total */}
              <div className="mb-4">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Vendas por Estado
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalVendas} vendas no período
                </p>
              </div>

              {/* Lista de Top Estados - Grid 2 colunas */}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Top Estados</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {salesByState
                    .sort((a, b) => b.vendas - a.vendas)
                    .slice(0, 10)
                    .map((state, index) => {
                      const stateName = BRAZIL_STATES_SVG[state.uf]?.name || state.uf;
                      const isSelected = selectedState === state.uf;
                      
                      return (
                        <div
                          key={state.uf}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-primary/20 border border-primary/30" 
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                          onClick={() => setSelectedState(selectedState === state.uf ? null : state.uf)}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-muted-foreground font-mono text-[10px]">#{index + 1}</span>
                            <span className="font-medium">{state.uf}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold">{state.vendas}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                  
                {salesByState.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma venda no período
                  </p>
                )}
              </div>
              
              {/* Detalhes do estado selecionado */}
              {selectedStateData && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {BRAZIL_STATES_SVG[selectedState!]?.name || selectedState}
                      </p>
                      <p className="text-lg font-bold">{selectedStateData.vendas} vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Faturamento</p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(selectedStateData.valor)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
