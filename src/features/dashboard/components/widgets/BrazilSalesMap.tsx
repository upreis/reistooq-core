import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = 'America/Sao_Paulo';

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

interface TopProduct {
  item_id: string;
  item_thumbnail: string | null;
  item_title: string | null;
  vendas: number;
  valorTotal: number;
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
  
  // Estados para imagem flutuante ampliada (mesmo padrão do QuickActionCards)
  const [hoveredProductIndex, setHoveredProductIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isImageVisible, setIsImageVisible] = useState(false);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Animação suave para seguir o mouse
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mousePosition]);

  const handleProductMouseMove = (e: React.MouseEvent) => {
    if (productsContainerRef.current) {
      const rect = productsContainerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleProductMouseEnter = (index: number) => {
    setHoveredProductIndex(index);
    setIsImageVisible(true);
  };

  const handleProductMouseLeave = () => {
    setHoveredProductIndex(null);
    setIsImageVisible(false);
  };

  // Formatar datas com timezone correto
  const dateStartISO = formatInTimeZone(dateRange.start, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
  const dateEndISO = formatInTimeZone(dateRange.end, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");

  // Buscar dados de vendas por estado
  const { data: salesByState = [], isLoading } = useQuery({
    queryKey: ["vendas-por-estado", selectedAccount, dateStartISO, dateEndISO],
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
        .gte("date_created", dateStartISO)
        .lte("date_created", dateEndISO);

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
    refetchInterval: 2 * 60 * 1000,
  });

  // Buscar top 5 produtos do estado selecionado
  const { data: topProductsByState = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["top-products-estado", selectedAccount, selectedState, dateStartISO, dateEndISO],
    queryFn: async () => {
      if (!selectedState) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organizacao_id) return [];

      let query = supabase
        .from("vendas_hoje_realtime")
        .select("item_id, item_thumbnail, item_title, total_amount")
        .eq("organization_id", profile.organizacao_id)
        .eq("shipping_state", selectedState)
        .gte("date_created", dateStartISO)
        .lte("date_created", dateEndISO);

      if (selectedAccount !== "todas") {
        query = query.eq("account_name", selectedAccount);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Agrupar por item_id
      const productMap = new Map<string, TopProduct>();
      (data || []).forEach((item: any) => {
        const existing = productMap.get(item.item_id);
        if (existing) {
          existing.vendas += 1;
          existing.valorTotal += item.total_amount || 0;
        } else {
          productMap.set(item.item_id, {
            item_id: item.item_id,
            item_thumbnail: item.item_thumbnail,
            item_title: item.item_title,
            vendas: 1,
            valorTotal: item.total_amount || 0,
          });
        }
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 10);
    },
    enabled: !!selectedState,
    staleTime: 60 * 1000,
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

  const formatCurrencyShort = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const truncateTitle = (title: string | null, maxLength: number = 30) => {
    if (!title) return "Produto";
    return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
  };

  const getHighQualityImage = (thumbnailUrl: string | null) => {
    if (!thumbnailUrl) return "/placeholder.svg";
    return thumbnailUrl
      .replace(/-I\.jpg/g, '-O.jpg')
      .replace(/-I\.webp/g, '-O.webp')
      .replace(/http:\/\//g, 'https://');
  };

  return (
    <Card className="border-muted-foreground/30 h-full flex flex-col bg-background">
      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Carregando mapa...
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {/* Mapa SVG - Esquerda */}
            <div className="relative w-[320px] flex-shrink-0 flex flex-col">
              <svg
                viewBox="0 0 612 640"
                className="w-full flex-1 max-h-[480px]"
                preserveAspectRatio="xMidYMid meet"
              >
                {Object.entries(BRAZIL_STATES_SVG).map(([uf, { name, path }]) => {
                  const stateData = getStateData(uf);
                  const vendas = stateData?.vendas || 0;
                  const isHovered = hoveredState === uf;
                  const isSelected = selectedState === uf;
                  
                  return (
                    <path
                      key={uf}
                      d={path}
                      fill={getStateColor(vendas, maxVendas)}
                      stroke={isSelected ? "#000000" : isHovered ? "#000000" : vendas > 0 ? "#000000" : "hsl(var(--primary))"}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : vendas > 0 ? 1 : 0.5}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredState(uf)}
                      onMouseLeave={() => setHoveredState(null)}
                      onClick={() => setSelectedState(selectedState === uf ? null : uf)}
                    />
                  );
                })}
              </svg>
              
              {/* Total de vendas abaixo do mapa */}
              <p className="text-xs text-muted-foreground mt-2">
                {totalVendas} vendas no período
              </p>
              
              {/* Tooltip customizado */}
              {hoveredState && (
                <div className="absolute top-2 left-2 bg-popover border border-border rounded-md px-2 py-1 shadow-md text-xs pointer-events-none z-10">
                  <div className="font-semibold">{BRAZIL_STATES_SVG[hoveredState]?.name} ({hoveredState})</div>
                  <div>{getStateData(hoveredState)?.vendas || 0} vendas</div>
                  {getStateData(hoveredState) && (
                    <div>{formatCurrency(getStateData(hoveredState)!.valor)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Conteúdo - Centro (Lista de Estados) */}
            <div className="w-[240px] flex flex-col min-w-0 flex-shrink-0">
              {/* Título */}
              <div className="mb-2">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  Vendas por Estado
                </div>
              </div>

              {/* Lista de Estados */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Cabeçalho */}
                <div className="grid grid-cols-[24px_32px_40px_1fr] gap-1 px-2 py-1 text-[10px] text-muted-foreground font-medium border-b border-border/50 mb-1">
                  <span>#</span>
                  <span>UF</span>
                  <span>Qtd</span>
                  <span>Valor</span>
                </div>
                
                {/* Lista - compacta */}
                <div className="flex-1 pr-1 overflow-y-auto">
                  {[...salesByState]
                    .sort((a, b) => b.vendas - a.vendas)
                    .map((state, index) => {
                      const isSelected = selectedState === state.uf;
                      
                      return (
                        <div
                          key={state.uf}
                          className={`grid grid-cols-[24px_32px_40px_1fr] gap-1 items-center px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-primary/20 border border-primary/30" 
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedState(selectedState === state.uf ? null : state.uf)}
                        >
                          <span className="text-muted-foreground font-mono text-[10px]">{index + 1}</span>
                          <span className="font-medium">{state.uf}</span>
                          <span className="font-semibold">{state.vendas}</span>
                          <span className="text-muted-foreground whitespace-nowrap">{formatCurrency(state.valor)}</span>
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
            </div>

            {/* Top 5 Produtos do Estado - Direita */}
            <div 
              ref={productsContainerRef}
              onMouseMove={handleProductMouseMove}
              className="flex-1 flex flex-col min-w-0 relative"
            >
              {/* Imagem flutuante ampliada - igual ao QuickActionCards */}
              {topProductsByState.length > 0 && (
                <div
                  className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
                  style={{
                    left: productsContainerRef.current?.getBoundingClientRect().left ?? 0,
                    top: productsContainerRef.current?.getBoundingClientRect().top ?? 0,
                    transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 140}px, 0)`,
                    opacity: isImageVisible ? 1 : 0,
                    scale: isImageVisible ? 1 : 0.8,
                    transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <div className="relative w-[280px] h-[280px] bg-secondary rounded-xl overflow-hidden">
                    {topProductsByState.map((product, index) => (
                      <img
                        key={product.item_id}
                        src={getHighQualityImage(product.item_thumbnail)}
                        alt={product.item_title || "Produto"}
                        className="absolute inset-0 w-full h-full object-contain bg-white transition-all duration-500 ease-out"
                        style={{
                          opacity: hoveredProductIndex === index ? 1 : 0,
                          scale: hoveredProductIndex === index ? 1 : 1.1,
                          filter: hoveredProductIndex === index ? "none" : "blur(10px)",
                        }}
                      />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
                  </div>
                </div>
              )}

              <div className="mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  {selectedState ? (
                    <span>Top 10 em {BRAZIL_STATES_SVG[selectedState]?.name || selectedState}</span>
                  ) : (
                    <span className="text-muted-foreground">Selecione um estado</span>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                {!selectedState ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                    Clique em um estado para ver os produtos mais vendidos
                  </div>
                ) : isLoadingProducts ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : topProductsByState.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
                    Nenhum produto encontrado
                  </div>
                ) : (
                  topProductsByState.map((product, index) => (
                    <div
                      key={product.item_id}
                      className="flex items-center gap-2 p-1.5 bg-muted/20 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                      onMouseEnter={() => handleProductMouseEnter(index)}
                      onMouseLeave={handleProductMouseLeave}
                    >
                      {/* Imagem */}
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        {product.item_thumbnail ? (
                          <img
                            src={getHighQualityImage(product.item_thumbnail)}
                            alt={product.item_title || "Produto"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-br">
                          #{index + 1}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium leading-tight line-clamp-2">
                          {truncateTitle(product.item_title)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-[#22c55e]">
                            {product.vendas} {product.vendas === 1 ? 'venda' : 'vendas'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatCurrencyShort(product.valorTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
