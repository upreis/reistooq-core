// 📊 Widget de Métricas em Tempo Real
// Exibe KPIs principais com atualizações automáticas

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  ShoppingCart, Users, Zap, Activity, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveMetricsProps {
  metrics: {
    totalSales: number;
    salesGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    activeProducts: number;
    lowStockProducts: number;
    activeUsers: number;
    newUsers: number;
  } | null;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'destructive';
  isLive?: boolean;
}

export function LiveMetricsWidget({ metrics }: LiveMetricsProps) {
  const [liveData, setLiveData] = useState<MetricCard[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Simulação de dados em tempo real
  useEffect(() => {
    const updateMetrics = () => {
      if (!metrics) return;

      const cards: MetricCard[] = [
        {
          title: 'Vendas Totais',
          value: `R$ ${(metrics.totalSales || 0).toLocaleString('pt-BR')}`,
          change: metrics.salesGrowth || 0,
          trend: (metrics.salesGrowth || 0) > 0 ? 'up' : (metrics.salesGrowth || 0) < 0 ? 'down' : 'stable',
          icon: DollarSign,
          color: 'success',
          isLive: true
        },
        {
          title: 'Pedidos Totais',
          value: metrics.totalOrders || 0,
          change: metrics.ordersGrowth || 0,
          trend: (metrics.ordersGrowth || 0) > 0 ? 'up' : (metrics.ordersGrowth || 0) < 0 ? 'down' : 'stable',
          icon: ShoppingCart,
          color: 'primary',
          isLive: true
        },
        {
          title: 'Produtos Ativos',
          value: metrics.activeProducts || 0,
          change: 0,
          trend: 'stable',
          icon: Package,
          color: 'primary'
        },
        {
          title: 'Estoque Baixo',
          value: metrics.lowStockProducts || 0,
          change: 0,
          trend: metrics.lowStockProducts > 0 ? 'down' : 'stable',
          icon: Package,
          color: metrics.lowStockProducts > 0 ? 'warning' : 'success'
        },
        {
          title: 'Usuários Ativos',
          value: metrics.activeUsers || 0,
          change: metrics.newUsers || 0,
          trend: (metrics.newUsers || 0) > 0 ? 'up' : 'stable',
          icon: Users,
          color: 'primary'
        }
      ];

      setLiveData(cards);
    };

    updateMetrics();

    // Atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      if (isLive) {
        updateMetrics();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [metrics, isLive]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3" />;
      case 'down': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: string, color: string) => {
    if (trend === 'stable') return 'text-muted-foreground';
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down' && color === 'warning') return 'text-red-600';
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Métricas em Tempo Real
            <Badge variant="outline" className="ml-auto">Carregando...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Métricas em Tempo Real
          <div className="ml-auto flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">AO VIVO</span>
              </div>
            )}
            <Badge variant="outline">Atualizado agora</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {liveData.map((metric, index) => {
            const IconComponent = metric.icon;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg",
                    metric.color === 'success' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                    metric.color === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                    metric.color === 'destructive' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                    metric.color === 'primary' && "bg-primary/10 text-primary"
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  {metric.isLive && (
                    <Zap className="h-3 w-3 text-yellow-500" />
                  )}
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">{metric.title}</p>
                  <p className="text-lg font-bold">{metric.value}</p>
                  
                  {metric.change !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      getTrendColor(metric.trend, metric.color)
                    )}>
                      {getTrendIcon(metric.trend)}
                      <span>
                        {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                        {Math.abs(metric.change)}
                        {metric.title.includes('Vendas') ? '%' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}