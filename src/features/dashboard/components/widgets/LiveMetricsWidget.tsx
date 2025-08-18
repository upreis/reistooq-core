// 🔥 Widget de Métricas em Tempo Real
// Exibe KPIs principais com atualizações automáticas

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  ShoppingCart, Users, Activity, Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveMetricsProps {
  metrics: any;
}

interface MetricCard {
  id: string;
  title: string;
  value: string;
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
      const baseMetrics: MetricCard[] = [
        {
          id: 'sales',
          title: 'Vendas Hoje',
          value: 'R$ 12.450',
          change: 8.2,
          trend: 'up',
          icon: DollarSign,
          color: 'success',
          isLive: true
        },
        {
          id: 'orders',
          title: 'Pedidos',
          value: '34',
          change: -2.1,
          trend: 'down',
          icon: ShoppingCart,
          color: 'warning'
        },
        {
          id: 'products',
          title: 'Produtos Ativos',
          value: metrics?.activeProducts?.toString() || '0',
          change: 5.3,
          trend: 'up',
          icon: Package,
          color: 'primary'
        },
        {
          id: 'users',
          title: 'Usuários Online',
          value: '8',
          change: 12.5,
          trend: 'up',
          icon: Users,
          color: 'primary',
          isLive: true
        }
      ];

      // Simulação de mudanças em tempo real
      const updatedMetrics = baseMetrics.map(metric => {
        if (metric.isLive) {
          const variation = (Math.random() - 0.5) * 2; // -1 a 1
          const newChange = metric.change + variation;
          return {
            ...metric,
            change: Math.round(newChange * 10) / 10,
            trend: newChange > 0 ? 'up' as const : newChange < 0 ? 'down' as const : 'stable' as const
          };
        }
        return metric;
      });

      setLiveData(updatedMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [metrics]);

  const getTrendIcon = (trend: string, isLiveMetric: boolean = false) => {
    const iconClass = cn("h-4 w-4", isLiveMetric && "animate-pulse");
    
    switch (trend) {
      case 'up':
        return <TrendingUp className={cn(iconClass, "text-success")} />;
      case 'down':
        return <TrendingDown className={cn(iconClass, "text-destructive")} />;
      default:
        return <Activity className={cn(iconClass, "text-muted-foreground")} />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'success':
        return 'bg-gradient-success';
      case 'warning':
        return 'bg-gradient-warning';
      case 'destructive':
        return 'bg-gradient-danger';
      default:
        return 'bg-gradient-primary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {liveData.map((metric) => {
        const IconComponent = metric.icon;
        
        return (
          <Card key={metric.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    {metric.isLive && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          LIVE
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {metric.value}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend, metric.isLive)}
                      <span className={cn(
                        "text-sm font-medium",
                        metric.trend === 'up' && "text-success",
                        metric.trend === 'down' && "text-destructive",
                        metric.trend === 'stable' && "text-muted-foreground"
                      )}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  getColorClasses(metric.color)
                )}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>

              {metric.isLive && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-hover animate-pulse"></div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}