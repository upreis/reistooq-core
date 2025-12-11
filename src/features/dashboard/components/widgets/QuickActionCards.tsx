import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface QuickActionCardsProps {
  selectedAccount: string;
}

interface TopProduct {
  item_id: string;
  item_thumbnail: string | null;
  item_title: string | null;
  vendas: number;
}

// Helper para obter início e fim do dia em São Paulo (UTC-3)
const getHojeRangeSaoPaulo = () => {
  const now = new Date();
  const offsetHours = 3;
  
  const startOfDaySP = new Date(now);
  startOfDaySP.setUTCHours(offsetHours, 0, 0, 0);
  
  if (now.getUTCHours() < offsetHours) {
    startOfDaySP.setUTCDate(startOfDaySP.getUTCDate() - 1);
  }
  
  const endOfDaySP = new Date(startOfDaySP);
  endOfDaySP.setUTCDate(endOfDaySP.getUTCDate() + 1);
  endOfDaySP.setUTCMilliseconds(-1);
  
  return {
    start: startOfDaySP.toISOString(),
    end: endOfDaySP.toISOString()
  };
};

export function QuickActionCards({ selectedAccount }: QuickActionCardsProps) {
  const { data: topProducts = [], isLoading } = useQuery({
    queryKey: ["top-products-hoje", selectedAccount],
    queryFn: async () => {
      const { start, end } = getHojeRangeSaoPaulo();
      
      let query = supabase
        .from("vendas_hoje_realtime")
        .select("item_id, item_thumbnail, item_title, account_name")
        .gte("date_created", start)
        .lte("date_created", end);

      if (selectedAccount !== "todas") {
        query = query.eq("account_name", selectedAccount);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por item_id e contar vendas
      const productCounts = new Map<string, TopProduct>();
      
      (data || []).forEach((item) => {
        const existing = productCounts.get(item.item_id);
        if (existing) {
          existing.vendas += 1;
        } else {
          productCounts.set(item.item_id, {
            item_id: item.item_id,
            item_thumbnail: item.item_thumbnail,
            item_title: item.item_title,
            vendas: 1
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

  // Truncar título do produto
  const truncateTitle = (title: string | null, maxLength: number = 40) => {
    if (!title) return "Produto";
    return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
  };

  return (
    <div className="bg-background border border-border rounded-xl p-3 h-full flex flex-col">
      <span className="text-xs font-medium text-muted-foreground mb-2">Mais Vendidos Hoje</span>
      <div className="flex gap-2 flex-1 items-stretch">
        {isLoading ? (
          // Skeleton loading - 5 cards
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-1.5 p-2 bg-muted/30 rounded-lg animate-pulse flex-1"
            >
              <div className="w-10 h-10 bg-muted rounded-md" />
              <div className="w-full h-2 bg-muted rounded" />
            </div>
          ))
        ) : topProducts.length === 0 ? (
          // Estado vazio - 5 cards
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center gap-1.5 p-2 bg-muted/20 rounded-lg flex-1"
            >
              <Package className="h-6 w-6 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">Sem vendas</span>
            </div>
          ))
        ) : (
          // Produtos mais vendidos - layout horizontal
          topProducts.map((product, index) => (
            <div
              key={product.item_id}
              className="flex flex-col items-center justify-center gap-1 p-1.5 bg-muted/20 rounded-lg hover:bg-accent/10 transition-all group flex-1"
            >
              {/* Imagem do produto */}
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                {product.item_thumbnail ? (
                  <img
                    src={product.item_thumbnail}
                    alt={product.item_title || "Produto"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                {/* Badge de ranking */}
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[7px] font-bold px-0.5 rounded-br">
                  #{index + 1}
                </div>
                {/* Badge de vendas */}
                <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[7px] font-bold px-0.5 rounded-tl">
                  {product.vendas}x
                </div>
              </div>
              
              {/* Nome do produto */}
              <span className="text-[8px] font-medium text-foreground text-center leading-tight line-clamp-2 w-full">
                {truncateTitle(product.item_title, 20)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
