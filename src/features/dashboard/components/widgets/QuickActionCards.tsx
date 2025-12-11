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

      // Ordenar por vendas e pegar top 4
      return Array.from(productCounts.values())
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 4);
    },
    refetchInterval: 60000,
  });

  // Truncar título do produto
  const truncateTitle = (title: string | null, maxLength: number = 40) => {
    if (!title) return "Produto";
    return title.length > maxLength ? title.slice(0, maxLength) + "..." : title;
  };

  return (
    <div className="flex flex-wrap gap-3">
      {isLoading ? (
        // Skeleton loading
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl animate-pulse min-w-[140px]"
          >
            <div className="w-20 h-20 bg-muted rounded-lg" />
            <div className="w-full h-3 bg-muted rounded" />
          </div>
        ))
      ) : topProducts.length === 0 ? (
        // Estado vazio
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl min-w-[140px]"
          >
            <div className="p-4 rounded-lg bg-muted/50">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground text-center">
              Sem vendas
            </span>
          </div>
        ))
      ) : (
        // Produtos mais vendidos
        topProducts.map((product, index) => (
          <div
            key={product.item_id}
            className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl hover:bg-accent/30 transition-all group min-w-[140px] max-w-[160px]"
          >
            {/* Imagem do produto */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {product.item_thumbnail ? (
                <img
                  src={product.item_thumbnail}
                  alt={product.item_title || "Produto"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {/* Badge de ranking */}
              <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                #{index + 1}
              </div>
              {/* Badge de vendas */}
              <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-lg">
                {product.vendas}x
              </div>
            </div>
            
            {/* Nome do produto */}
            <span className="text-xs font-medium text-foreground text-center leading-tight line-clamp-2 w-full">
              {truncateTitle(product.item_title, 40)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
