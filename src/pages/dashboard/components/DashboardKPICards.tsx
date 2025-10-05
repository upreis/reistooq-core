import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Users, Package } from 'lucide-react';

interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface DashboardKPICardsProps {
  salesToday: number;
  salesTodayChange: number;
  ordersMonth: number;
  ordersMonthChange: number;
  totalRevenue: number;
  totalRevenueChange: number;
  newCustomers: number;
  newCustomersChange: number;
}

export function DashboardKPICards({
  salesToday,
  salesTodayChange,
  ordersMonth,
  ordersMonthChange,
  totalRevenue,
  totalRevenueChange,
  newCustomers,
  newCustomersChange,
}: DashboardKPICardsProps) {
  const metrics: KPIMetric[] = [
    {
      label: 'Vendas Hoje',
      value: salesToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: salesTodayChange,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-blue-500',
    },
    {
      label: 'Pedidos do Mês',
      value: ordersMonth,
      change: ordersMonthChange,
      icon: <ShoppingCart className="h-5 w-5" />,
      color: 'text-purple-500',
    },
    {
      label: 'Receita Total',
      value: totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      change: totalRevenueChange,
      icon: <Package className="h-5 w-5" />,
      color: 'text-green-500',
    },
    {
      label: 'Novos Clientes',
      value: newCustomers,
      change: newCustomersChange,
      icon: <Users className="h-5 w-5" />,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.label}
            </CardTitle>
            <div className={metric.color}>{metric.icon}</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center gap-1 mt-1">
              {metric.change >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(metric.change).toFixed(1)}% vs período anterior
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
