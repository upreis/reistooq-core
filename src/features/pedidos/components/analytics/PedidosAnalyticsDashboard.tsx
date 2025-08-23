import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Target,
  BarChart3,
  PieChart,
  MapPin,
  Clock
} from 'lucide-react';
import { PedidosAnalytics } from '../../types/pedidos.types';
import { formatMoney } from '@/lib/format';

interface PedidosAnalyticsDashboardProps {
  analytics: PedidosAnalytics | undefined;
  loading?: boolean;
  className?: string;
}

export function PedidosAnalyticsDashboard({ 
  analytics, 
  loading = false,
  className 
}: PedidosAnalyticsDashboardProps) {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado disponível para análise
        </CardContent>
      </Card>
    );
  }

  const {
    total_pedidos,
    total_receita,
    pedidos_hoje,
    receita_hoje,
    status_distribution,
    top_produtos,
    revenue_trend,
    mapping_stats
  } = analytics;

  // Calculate growth rates (mock data for demo)
  const pedidosGrowth = pedidos_hoje > 0 ? 15 : -5;
  const receitaGrowth = receita_hoje > 0 ? 23 : -8;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total_pedidos.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{pedidosGrowth}%</span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(total_receita)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{receitaGrowth}%</span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Orders Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidos_hoje}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Receita: {formatMoney(receita_hoje)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Mapping Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapeamento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mapping_stats.percentage}%</div>
            <Progress value={mapping_stats.percentage} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {mapping_stats.mapeados} de {mapping_stats.total} pedidos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(status_distribution)
                .sort(([,a], [,b]) => b - a)
                .map(([status, count]) => {
                  const percentage = total_pedidos > 0 ? Math.round((count / total_pedidos) * 100) : 0;
                  
                  const getStatusColor = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'entregue': return 'bg-green-500';
                      case 'pago': return 'bg-blue-500';
                      case 'enviado': return 'bg-orange-500';
                      case 'cancelado': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <span className="text-sm">{status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="w-16 h-2" />
                        <span className="text-sm font-medium w-8">{count}</span>
                        <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_produtos.slice(0, 5).map((produto, index) => (
                <div key={produto.sku} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {produto.nome || produto.sku}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {produto.quantidade} unidades
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatMoney(produto.receita)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {produto.sku}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      {revenue_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Receita (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {revenue_trend.slice(-10).map((item, index) => {
                const date = new Date(item.date).toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: '2-digit' 
                });
                
                return (
                  <div key={item.date} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">{date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{item.orders} pedidos</span>
                      <span className="text-sm font-medium">{formatMoney(item.revenue)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{mapping_stats.mapeados}</div>
            <div className="text-xs text-muted-foreground">Pedidos Mapeados</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">{mapping_stats.sem_mapeamento}</div>
            <div className="text-xs text-muted-foreground">Sem Mapeamento</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">
              {total_pedidos > 0 ? formatMoney(total_receita / total_pedidos) : formatMoney(0)}
            </div>
            <div className="text-xs text-muted-foreground">Ticket Médio</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">{top_produtos.length}</div>
            <div className="text-xs text-muted-foreground">Produtos Únicos</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}