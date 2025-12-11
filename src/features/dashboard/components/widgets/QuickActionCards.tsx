import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { formatInTimeZone } from "date-fns-tz";

interface QuickActionCardsProps {
  selectedAccount: string;
  dateRange: { start: Date; end: Date };
}

interface TopProduct {
  item_id: string;
  item_thumbnail: string | null;
  item_title: string | null;
  vendas: number;
  valorTotal: number;
}

export function QuickActionCards({ selectedAccount, dateRange }: QuickActionCardsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setIsVisible(false);
  };

  // Converter datas para strings com timezone São Paulo
  const dateStartISO = useMemo(() => 
    formatInTimeZone(dateRange.start, 'America/Sao_Paulo', "yyyy-MM-dd'T'00:00:00XXX"), 
    [dateRange.start]
  );
  const dateEndISO = useMemo(() => 
    formatInTimeZone(dateRange.end, 'America/Sao_Paulo', "yyyy-MM-dd'T'23:59:59XXX"), 
    [dateRange.end]
  );

  // Estado para armazenar thumbnails enriquecidos
  const [enrichedThumbnails, setEnrichedThumbnails] = useState<Record<string, string>>({});
  const enrichingRef = useRef<Set<string>>(new Set());

  const { data: topProducts = [], isLoading, refetch } = useQuery({
    queryKey: ["top-products-periodo", selectedAccount, dateStartISO, dateEndISO],
    queryFn: async () => {
      // Buscar TODOS os registros com paginação para evitar limite de 1000
      const allData: Array<{ item_id: string; item_thumbnail: string | null; item_title: string | null; account_name: string | null; total_amount: number | null; integration_account_id: string | null }> = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("vendas_hoje_realtime")
          .select("item_id, item_thumbnail, item_title, account_name, total_amount, integration_account_id")
          .gte("date_created", dateStartISO)
          .lte("date_created", dateEndISO)
          .range(offset, offset + pageSize - 1);

        if (selectedAccount !== "todas") {
          query = query.eq("account_name", selectedAccount);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData.push(...data);
          offset += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Agrupar por item_id e contar vendas + somar valor
      const productCounts = new Map<string, TopProduct & { integration_account_id: string | null }>();
      
      allData.forEach((item) => {
        const existing = productCounts.get(item.item_id);
        if (existing) {
          existing.vendas += 1;
          existing.valorTotal += item.total_amount || 0;
          // Manter o primeiro thumbnail encontrado se existir
          if (!existing.item_thumbnail && item.item_thumbnail) {
            existing.item_thumbnail = item.item_thumbnail;
          }
        } else {
          productCounts.set(item.item_id, {
            item_id: item.item_id,
            item_thumbnail: item.item_thumbnail,
            item_title: item.item_title,
            vendas: 1,
            valorTotal: item.total_amount || 0,
            integration_account_id: item.integration_account_id
          });
        }
      });

      // Ordenar por vendas e pegar top 5
      return Array.from(productCounts.values())
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5);
    },
    refetchInterval: 60000,
  });

  // Enriquecer thumbnails faltantes
  useEffect(() => {
    const enrichMissingThumbnails = async () => {
      const itemsWithoutThumbnail = topProducts.filter(
        (p) => !p.item_thumbnail && !enrichedThumbnails[p.item_id] && !enrichingRef.current.has(p.item_id)
      );

      if (itemsWithoutThumbnail.length === 0) return;

      // Agrupar por integration_account_id
      const byAccount = new Map<string, string[]>();
      itemsWithoutThumbnail.forEach((item) => {
        const accountId = (item as any).integration_account_id;
        if (accountId) {
          const existing = byAccount.get(accountId) || [];
          existing.push(item.item_id);
          byAccount.set(accountId, existing);
          enrichingRef.current.add(item.item_id);
        }
      });

      // Chamar Edge Function para cada conta
      for (const [accountId, itemIds] of byAccount) {
        try {
          const { data, error } = await supabase.functions.invoke('enrich-thumbnails', {
            body: { item_ids: itemIds, integration_account_id: accountId }
          });

          if (!error && data?.thumbnails) {
            setEnrichedThumbnails((prev) => ({ ...prev, ...data.thumbnails }));
            // Refetch para atualizar os dados do banco
            setTimeout(() => refetch(), 1000);
          }
        } catch (err) {
          console.error('Error enriching thumbnails:', err);
        } finally {
          itemIds.forEach((id) => enrichingRef.current.delete(id));
        }
      }
    };

    if (topProducts.length > 0) {
      enrichMissingThumbnails();
    }
  }, [topProducts, enrichedThumbnails, refetch]);

  // Truncar título do produto
  const truncateTitle = (title: string | null, maxLength: number = 40) => {
    if (!title) return "Produto";
    return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
  };

  // Formatar valor em BRL
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Converter thumbnail para versão de alta qualidade do ML
  const getHighQualityImage = (thumbnailUrl: string | null, itemId?: string) => {
    // Primeiro verifica se temos um thumbnail enriquecido
    const enrichedUrl = itemId ? enrichedThumbnails[itemId] : null;
    const url = enrichedUrl || thumbnailUrl;
    
    if (!url) return "/placeholder.svg";
    // ML thumbnails podem ter sufixos como -I.jpg, -O.jpg, -F.webp
    // Substituir para pegar versão maior (-O ou sem sufixo de tamanho)
    return url
      .replace(/-I\.jpg/g, '-O.jpg')
      .replace(/-I\.webp/g, '-O.webp')
      .replace(/-F\.jpg/g, '-O.jpg')
      .replace(/-F\.webp/g, '-O.webp')
      .replace(/http:\/\//g, 'https://');
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="bg-background border border-muted-foreground/30 rounded-xl p-2 h-full flex items-center relative"
    >
      {/* Imagem flutuante ampliada */}
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
        style={{
          left: containerRef.current?.getBoundingClientRect().left ?? 0,
          top: containerRef.current?.getBoundingClientRect().top ?? 0,
          transform: `translate3d(${smoothPosition.x + 20}px, ${smoothPosition.y - 140}px, 0)`,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? 1 : 0.8,
          transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="relative w-[280px] h-[280px] bg-secondary rounded-xl overflow-hidden">
          {topProducts.map((product, index) => (
            <img
              key={product.item_id}
              src={getHighQualityImage(product.item_thumbnail, product.item_id)}
              alt={product.item_title || "Produto"}
              className="absolute inset-0 w-full h-full object-contain bg-white transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                scale: hoveredIndex === index ? 1 : 1.1,
                filter: hoveredIndex === index ? "none" : "blur(10px)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
        </div>
      </div>

      <div className="flex gap-2 flex-1 items-stretch h-full">
        {isLoading ? (
          // Skeleton loading - 5 cards
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center bg-muted/30 rounded-lg animate-pulse flex-1"
            >
              <div className="w-16 h-16 bg-muted rounded-md" />
            </div>
          ))
        ) : topProducts.length === 0 ? (
          // Estado vazio - 5 cards
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center bg-muted/20 rounded-lg flex-1"
            >
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
          ))
        ) : (
          // Produtos mais vendidos - layout horizontal
          topProducts.map((product, index) => (
            <div
              key={product.item_id}
              className="flex flex-col items-center justify-start gap-1 p-1.5 bg-muted/20 rounded-lg hover:bg-accent/10 transition-all group flex-1 cursor-pointer"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Imagem do produto */}
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {(product.item_thumbnail || enrichedThumbnails[product.item_id]) ? (
                  <img
                    src={getHighQualityImage(product.item_thumbnail, product.item_id)}
                    alt={product.item_title || "Produto"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {/* Badge de ranking */}
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded-br">
                  #{index + 1}
                </div>
              </div>
              
              {/* Nome do produto */}
              <span className="text-[9px] font-medium text-foreground text-center leading-tight line-clamp-3 w-full px-0.5">
                {truncateTitle(product.item_title, 40)}
              </span>
              
              {/* Valor vendido */}
              <span className="text-[10px] font-bold text-[#22c55e] text-center">
                {formatCurrency(product.valorTotal)}
              </span>
              
              {/* Quantidade vendida */}
              <div className="flex items-baseline gap-0.5 justify-center">
                <span className="text-[12px] font-bold text-[#22c55e]">
                  {product.vendas}
                </span>
                <span className="text-[8px] text-muted-foreground">
                  {product.vendas === 1 ? 'vendido' : 'vendidos'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
