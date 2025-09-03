import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Activity
} from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface EstoqueStatsProps {
  products: Product[];
}

export function EstoqueStats({ products }: EstoqueStatsProps) {
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.ativo).length;
  const inactiveProducts = totalProducts - activeProducts;
  
  const lowStockProducts = products.filter(p => 
    p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0
  ).length;
  
  const outOfStockProducts = products.filter(p => p.quantidade_atual === 0).length;
  
  const highStockProducts = products.filter(p => 
    p.quantidade_atual >= p.estoque_maximo
  ).length;
  
  const totalStockValue = products.reduce((total, p) => 
    total + (p.quantidade_atual * (p.preco_custo || 0)), 0
  );
  
  const totalSaleValue = products.reduce((total, p) => 
    total + (p.quantidade_atual * (p.preco_venda || 0)), 0
  );
  
  const totalQuantity = products.reduce((total, p) => total + p.quantidade_atual, 0);
  
  const averageStockDays = products.filter(p => p.ultima_movimentacao).length > 0
    ? Math.round(
        products
          .filter(p => p.ultima_movimentacao)
          .reduce((total, p) => {
            const daysSinceLastMovement = Math.floor(
              (Date.now() - new Date(p.ultima_movimentacao!).getTime()) / (1000 * 60 * 60 * 24)
            );
            return total + daysSinceLastMovement;
          }, 0) / products.filter(p => p.ultima_movimentacao).length
      )
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const stats = [
    {
      title: "Total de Produtos",
      value: formatNumber(totalProducts),
      subtitle: `${activeProducts} ativos, ${inactiveProducts} inativos`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null
    },
    {
      title: "Alertas de Estoque",
      value: formatNumber(lowStockProducts + outOfStockProducts),
      subtitle: `${lowStockProducts} baixo, ${outOfStockProducts} sem estoque`,
      icon: AlertTriangle,
      color: lowStockProducts + outOfStockProducts > 0 ? "text-red-600" : "text-green-600",
      bgColor: lowStockProducts + outOfStockProducts > 0 ? "bg-red-50" : "bg-green-50",
      trend: lowStockProducts + outOfStockProducts > 0 ? "critical" : "good"
    },
    {
      title: "Valor do Estoque",
      value: formatPrice(totalStockValue),
      subtitle: `Valor de venda: ${formatPrice(totalSaleValue)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up"
    },
    {
      title: "Quantidade Total",
      value: formatNumber(totalQuantity),
      subtitle: `${highStockProducts} produtos com estoque alto`,
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: null
    },
    {
      title: "Giro Médio",
      value: `${averageStockDays} dias`,
      subtitle: averageStockDays > 30 ? "Estoque parado" : "Boa rotatividade",
      icon: Activity,
      color: averageStockDays > 30 ? "text-orange-600" : "text-green-600",
      bgColor: averageStockDays > 30 ? "bg-orange-50" : "bg-green-50",
      trend: averageStockDays > 30 ? "warning" : "good"
    },
    {
      title: "Margem Potencial",
      value: formatPrice(totalSaleValue - totalStockValue),
      subtitle: `${((totalSaleValue - totalStockValue) / totalStockValue * 100).toFixed(1)}% de margem`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: "up"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden border-border/50 shadow-sm backdrop-blur-sm bg-card/80 hover:shadow-md transition-all group">
            <CardContent className="p-6">
              <div className="space-y-3">
                {/* Header com ícone e trend */}
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.trend && (
                    <Badge 
                      variant={
                        stat.trend === "critical" ? "destructive" : 
                        stat.trend === "warning" ? "secondary" : 
                        "default"
                      }
                      className="text-xs shadow-sm"
                    >
                      {stat.trend === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {stat.trend === "warning" && <TrendingDown className="w-3 h-3 mr-1" />}
                      {stat.trend === "good" && <TrendingUp className="w-3 h-3 mr-1" />}
                      {stat.trend === "up" && <TrendingUp className="w-3 h-3 mr-1" />}
                      {stat.trend === "critical" ? "Crítico" : 
                       stat.trend === "warning" ? "Atenção" : 
                       stat.trend === "good" ? "Bom" : "Alta"}
                    </Badge>
                  )}
                </div>
                
                {/* Título */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {stat.title}
                  </p>
                  
                  <p className="text-2xl font-bold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                </div>
                
                {/* Subtítulo */}
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  {stat.subtitle}
                </p>

                {/* Indicador visual sutil */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}