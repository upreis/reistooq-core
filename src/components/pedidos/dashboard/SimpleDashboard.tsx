import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/format';
import { Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface SimpleDashboardProps {
  data: {
    total: number;
    valorTotal: number;
    pedidosPendentes: number;
    pedidosEntregues: number;
  };
  isLoading?: boolean;
}

export const SimpleDashboard = memo(function SimpleDashboard({ 
  data, 
  isLoading = false 
}: SimpleDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Total de Pedidos',
      value: data.total.toLocaleString(),
      icon: Package,
      color: 'text-blue-600'
    },
    {
      label: 'Valor Total',
      value: formatMoney(data.valorTotal),
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Pendentes',
      value: data.pedidosPendentes.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-yellow-600'
    },
    {
      label: 'Entregues',
      value: data.pedidosEntregues.toLocaleString(),
      icon: TrendingUp,
      color: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold">
                  {stat.value}
                </p>
              </div>
              <IconComponent className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
});