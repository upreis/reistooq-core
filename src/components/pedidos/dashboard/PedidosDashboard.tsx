/**
 * 🚀 DASHBOARD INTELIGENTE DE PEDIDOS
 * Componente independente que não afeta funcionalidade existente
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

interface DashboardProps {
  orders: any[];
  loading: boolean;
  onRefresh: () => void;
  className?: string;
}

export function PedidosDashboard({ orders, loading, onRefresh, className }: DashboardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Cálculos dos KPIs principais
  const dashboardData = useMemo(() => {
    if (!orders?.length) {
      return {
        totalPedidos: 0,
        pedidosPendentes: 0,
        pedidosEntregues: 0,
        pedidosCancelados: 0,
        receitaTotal: 0,
        receitaMedia: 0,
        statusDistribution: {},
        tendencias: {}
      };
    }

    const totalPedidos = orders.length;
    
    // Contadores por status
    const statusCount = orders.reduce((acc, order) => {
      const status = order.situacao || 'indefinido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pedidosPendentes = (statusCount['pending'] || 0) + (statusCount['ready_to_ship'] || 0);
    const pedidosEntregues = statusCount['delivered'] || 0;
    const pedidosCancelados = statusCount['cancelled'] || 0;

    // Cálculos financeiros
    const receitaTotal = orders.reduce((sum, order) => {
      const valor = Number(order.valor_total || 0);
      return sum + (isNaN(valor) ? 0 : valor);
    }, 0);

    const receitaMedia = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

    return {
      totalPedidos,
      pedidosPendentes,
      pedidosEntregues,
      pedidosCancelados,
      receitaTotal,
      receitaMedia,
      statusDistribution: statusCount,
      tendencias: {
        // Placeholder para tendências futuras
        crescimento: '+12%',
        periodo: 'vs. mês anterior'
      }
    };
  }, [orders]);

  const widgets = [
    {
      title: 'Total de Pedidos',
      value: dashboardData.totalPedidos,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: dashboardData.tendencias.crescimento
    },
    {
      title: 'Pedidos Pendentes',
      value: dashboardData.pedidosPendentes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      urgent: dashboardData.pedidosPendentes > 10
    },
    {
      title: 'Pedidos Entregues',
      value: dashboardData.pedidosEntregues,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Receita Total',
      value: formatMoney(dashboardData.receitaTotal),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      isFinancial: true
    }
  ];

  if (!isVisible) {
    return (
      <div className={cn("mb-6", className)}>
        <Button
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="w-full border-dashed"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Mostrar Dashboard Inteligente
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("mb-6 space-y-4", className)}>
      {/* Header do Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Dashboard Inteligente</h3>
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {widget.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {widget.isFinancial ? widget.value : (typeof widget.value === 'number' ? widget.value.toLocaleString() : widget.value)}
                    </p>
                    {widget.urgent && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgente
                      </Badge>
                    )}
                  </div>
                  {widget.trend && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {widget.trend}
                    </p>
                  )}
                </div>
                <div className={cn("p-3 rounded-lg", widget.bgColor)}>
                  <widget.icon className={cn("h-6 w-6", widget.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Distribution */}
      {Object.keys(dashboardData.statusDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(dashboardData.statusDistribution).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground capitalize">
                    {status.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-bold">{count as number}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Inteligentes */}
      {dashboardData.pedidosPendentes > 5 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  Atenção: {dashboardData.pedidosPendentes} pedidos pendentes
                </p>
                <p className="text-sm text-yellow-700">
                  Recomendamos revisar os pedidos com status "ready_to_ship" e "pending"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}