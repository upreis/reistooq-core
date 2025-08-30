/**
 * 🚀 PRIORIDADE 2 - DASHBOARD SIMPLIFICADO E OTIMIZADO
 * Componente leve focado em métricas essenciais
 */

import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';

interface SimpleDashboardProps {
  orders: any[];
  loading?: boolean;
}

interface Metrics {
  totalOrders: number;
  totalValue: number;
  pendingOrders: number;
  deliveredOrders: number;
  avgOrderValue: number;
}

const SimpleDashboard = memo<SimpleDashboardProps>(({ orders, loading }) => {
  // Memoized metrics calculation
  const metrics = useMemo((): Metrics => {
    if (!orders?.length) {
      return {
        totalOrders: 0,
        totalValue: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        avgOrderValue: 0
      };
    }

    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + (order.valor_total || 0), 0);
    const pendingOrders = orders.filter(order => 
      order.shipping_status === 'pending' || 
      order.situacao === 'Aberto' ||
      order.situacao === 'Pago'
    ).length;
    const deliveredOrders = orders.filter(order => 
      order.shipping_status === 'delivered' || 
      order.situacao === 'Entregue'
    ).length;
    const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    return {
      totalOrders,
      totalValue,
      pendingOrders,
      deliveredOrders,
      avgOrderValue
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de Pedidos */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
            <p className="text-2xl font-bold">{metrics.totalOrders}</p>
          </div>
          <Package className="h-8 w-8 text-primary" />
        </div>
      </Card>

      {/* Valor Total */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">{formatMoney(metrics.totalValue)}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      {/* Pedidos Pendentes */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{metrics.pendingOrders}</p>
              <Badge variant="secondary" className="text-xs">
                {metrics.totalOrders > 0 ? Math.round((metrics.pendingOrders / metrics.totalOrders) * 100) : 0}%
              </Badge>
            </div>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
      </Card>

      {/* Pedidos Entregues */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Entregues</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{metrics.deliveredOrders}</p>
              <Badge variant="default" className="text-xs">
                {metrics.totalOrders > 0 ? Math.round((metrics.deliveredOrders / metrics.totalOrders) * 100) : 0}%
              </Badge>
            </div>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </Card>

      {/* Ticket Médio */}
      <Card className="p-4 md:col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
            <p className="text-xl font-bold">{formatMoney(metrics.avgOrderValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              Baseado em {metrics.totalOrders} pedidos
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
});

SimpleDashboard.displayName = 'SimpleDashboard';

export { SimpleDashboard };