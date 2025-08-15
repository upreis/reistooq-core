import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  CalendarDays,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { HistoricoSummary } from '../types/historicoTypes';
import { useQuery } from '@tanstack/react-query';
import { HistoricoAnalyticsService } from '../services/historicoAnalyticsService';

interface HistoricoAnalyticsDashboardProps {
  summary?: HistoricoSummary;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export const HistoricoAnalyticsDashboard: React.FC<HistoricoAnalyticsDashboardProps> = ({
  summary,
  dateRange
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('day');

  // Query para analytics avançados
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['historico-analytics', dateRange?.start, dateRange?.end],
    queryFn: () => HistoricoAnalyticsService.getAnalytics(dateRange?.start, dateRange?.end),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
    enabled: !!summary // Só buscar se já tiver summary básico
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-4 w-4 text-emerald-500" />;
    if (trend < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (!summary && !isLoadingAnalytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">--</div>
                <div className="text-sm text-muted-foreground">Carregando...</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mainMetrics = [
    {
      title: 'Total de Vendas',
      value: summary?.totalVendas || 0,
      formatter: formatNumber,
      icon: ShoppingCart,
      trend: analytics?.vendas.crescimentoDiario,
      trendLabel: 'vs ontem',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Receita Total',
      value: summary?.valorTotalVendas || 0,
      formatter: formatCurrency,
      icon: DollarSign,
      trend: analytics?.vendas.crescimentoSemanal,
      trendLabel: 'vs semana',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Ticket Médio',
      value: summary?.ticketMedio || 0,
      formatter: formatCurrency,
      icon: TrendingUp,
      trend: analytics?.vendas.crescimentoMensal,
      trendLabel: 'vs mês',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Clientes Únicos',
      value: summary?.clientesUnicos || 0,
      formatter: formatNumber,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const secondaryMetrics = [
    {
      title: 'Itens Vendidos',
      value: summary?.quantidadeTotalItens || 0,
      formatter: formatNumber,
      icon: Package
    },
    {
      title: 'Produtos Únicos',
      value: summary?.produtosUnicos || 0,
      formatter: formatNumber,
      icon: Package
    },
    {
      title: 'Vendas Hoje',
      value: analytics?.vendas.hoje || 0,
      formatter: formatNumber,
      icon: CalendarDays
    },
    {
      title: 'Vendas esta Semana',
      value: analytics?.vendas.semana || 0,
      formatter: formatNumber,
      icon: CalendarDays
    }
  ];

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">
                      {metric.formatter(metric.value)}
                    </p>
                    {metric.trend !== undefined && (
                      <div className={`flex items-center space-x-1 ${getTrendColor(metric.trend)}`}>
                        {getTrendIcon(metric.trend)}
                        <span className="text-xs font-medium">
                          {Math.abs(metric.trend).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {metric.trendLabel && (
                    <p className="text-xs text-muted-foreground">
                      {metric.trendLabel}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor || 'bg-muted'}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color || 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-muted">
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </p>
                  <p className="text-lg font-bold">
                    {metric.formatter(metric.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Produtos (se disponível) */}
      {analytics?.produtos.topVendidos && analytics.produtos.topVendidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Produtos Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.produtos.topVendidos.slice(0, 5).map((produto, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{produto.nome}</p>
                      <p className="text-sm text-muted-foreground">{produto.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(produto.quantidade)} und</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(produto.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estados com Mais Vendas (se disponível) */}
      {analytics?.geografico.estados && analytics.geografico.estados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.geografico.estados.slice(0, 6).map((estado, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{estado.uf}</p>
                    <p className="text-sm text-muted-foreground">{formatNumber(estado.vendas)} vendas</p>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(estado.valor)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};