import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Activity,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Filter
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface EstoqueStatsProps {
  products: Product[];
}

export function EstoqueStats({ products }: EstoqueStatsProps) {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
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

  if (!isVisible) {
    return (
      <div className="md:hidden flex justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Filter className="h-3 w-3" />
          Filtros
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
          Mostrar estatísticas
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 mb-4">
        {/* Controles mobile */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Filter className="h-3 w-3" />
            Filtros
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="h-3 w-3" />
            Ocultar
          </Button>
        </div>

        {/* Cards com scroll horizontal */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              
              return (
                <Card key={index} className="w-[140px] flex-shrink-0">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Ícone e badge */}
                      <div className="flex items-center justify-between">
                        <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                          <IconComponent className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        {stat.trend && (
                          <Badge 
                            variant={
                              stat.trend === "critical" ? "destructive" : 
                              stat.trend === "warning" ? "secondary" : 
                              "default"
                            }
                            className="text-[8px] px-1 py-0.5 h-3"
                          >
                            {stat.trend === "critical" && <AlertTriangle className="w-1.5 h-1.5" />}
                            {stat.trend === "warning" && <TrendingDown className="w-1.5 h-1.5" />}
                            {stat.trend === "good" && <TrendingUp className="w-1.5 h-1.5" />}
                            {stat.trend === "up" && <TrendingUp className="w-1.5 h-1.5" />}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Título */}
                      <p className="text-xs font-medium text-muted-foreground leading-tight">
                        {stat.title}
                      </p>
                      
                      {/* Valor */}
                      <p className="text-lg font-bold text-foreground leading-tight">
                        {stat.value}
                      </p>
                      
                      {/* Subtitle */}
                      <p className="text-[10px] text-muted-foreground/70 leading-tight line-clamp-2">
                        {stat.subtitle}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Versão desktop original
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-5">
              <div className="space-y-4">
                {/* Header com ícone e trend */}
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-lg ${stat.bgColor} group-hover:scale-105 transition-transform duration-200`}>
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.trend && (
                    <Badge 
                      variant={
                        stat.trend === "critical" ? "destructive" : 
                        stat.trend === "warning" ? "secondary" : 
                        "default"
                      }
                      className="text-[10px] px-2 py-0.5 h-5 shadow-sm border-0"
                    >
                      {stat.trend === "critical" && <AlertTriangle className="w-2.5 h-2.5 mr-1" />}
                      {stat.trend === "warning" && <TrendingDown className="w-2.5 h-2.5 mr-1" />}
                      {stat.trend === "good" && <TrendingUp className="w-2.5 h-2.5 mr-1" />}
                      {stat.trend === "up" && <TrendingUp className="w-2.5 h-2.5 mr-1" />}
                      {stat.trend === "critical" ? "Crítico" : 
                       stat.trend === "warning" ? "Atenção" : 
                       stat.trend === "good" ? "Bom" : "Alta"}
                    </Badge>
                  )}
                </div>
                
                {/* Conteúdo principal */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground/90 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  
                  <p className="text-2xl font-bold text-foreground tracking-tight leading-none">
                    {stat.value}
                  </p>
                  
                  <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    {stat.subtitle}
                  </p>
                </div>

                {/* Indicador visual sutil */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}