import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  DollarSign,
  AlertTriangle,
  BarChart3,
  Users,
  Link2
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useProductHierarchy } from "@/hooks/useProductHierarchy";

interface EstoqueStatsProps {
  products: Product[];
}

export function EstoqueStats({ products }: EstoqueStatsProps) {
  const hierarchy = useProductHierarchy(products);

  const stats = {
    totalProducts: products.length,
    totalParents: hierarchy.parentProducts.length,
    totalChildren: hierarchy.childProducts.length,
    totalIndependent: hierarchy.independentProducts.length,
    totalGroups: hierarchy.productGroups.length,
    totalStock: products.reduce((sum, p) => sum + p.quantidade_atual, 0),
    totalValue: products.reduce((sum, p) => sum + (p.preco_venda || 0) * p.quantidade_atual, 0),
    lowStock: products.filter(p => p.quantidade_atual <= p.estoque_minimo && p.quantidade_atual > 0).length,
    outOfStock: products.filter(p => p.quantidade_atual === 0).length,
    stockDistribution: {
      normal: products.filter(p => 
        p.quantidade_atual > p.estoque_minimo && 
        (p.estoque_maximo === 0 || p.quantidade_atual < p.estoque_maximo)
      ).length,
      low: products.filter(p => 
        p.quantidade_atual <= p.estoque_minimo && 
        p.quantidade_atual > 0
      ).length,
      out: products.filter(p => p.quantidade_atual === 0).length,
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStockHealthColor = () => {
    const healthScore = (stats.stockDistribution.normal / products.length) * 100;
    if (healthScore >= 70) return "text-green-600";
    if (healthScore >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const stockHealthScore = products.length > 0 
    ? (stats.stockDistribution.normal / products.length) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Resumo Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <Users className="h-3 w-3" />
            <span>{stats.totalGroups} grupos</span>
            <Link2 className="h-3 w-3" />
            <span>{stats.totalChildren} variações</span>
          </div>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <div className="text-xs text-muted-foreground mt-2">
            {stats.totalStock} unidades em estoque
          </div>
        </CardContent>
      </Card>

      {/* Alertas de Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sem estoque</span>
              <Badge variant="destructive" className="text-xs">
                {stats.outOfStock}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estoque baixo</span>
              <Badge variant="secondary" className="text-xs">
                {stats.lowStock}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saúde do Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saúde do Estoque</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Score</span>
              <span className={`text-sm font-bold ${getStockHealthColor()}`}>
                {stockHealthScore.toFixed(1)}%
              </span>
            </div>
            <Progress value={stockHealthScore} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {stats.stockDistribution.normal} produtos em nível normal
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
