import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Weight, 
  Ruler, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface AnalyticsData {
  totalCotacoes: number;
  totalValueUSD: number;
  totalItems: number;
  totalWeight: number;
  totalVolume: number;
  statusDistribution: Record<string, number>;
  monthlyTrend: number;
}

interface CotacoesAnalyticsPanelProps {
  cotacoes: any[];
  className?: string;
}

/**
 * Painel de analytics para cotações internacionais
 * Componente memoizado com cálculos otimizados
 */
export const CotacoesAnalyticsPanel = memo<CotacoesAnalyticsPanelProps>(({ 
  cotacoes, 
  className = "" 
}) => {
  // Cálculos memoizados para performance
  const analytics = useMemo((): AnalyticsData => {
    if (!Array.isArray(cotacoes) || cotacoes.length === 0) {
      return {
        totalCotacoes: 0,
        totalValueUSD: 0,
        totalItems: 0,
        totalWeight: 0,
        totalVolume: 0,
        statusDistribution: {},
        monthlyTrend: 0
      };
    }

    const statusCount: Record<string, number> = {};
    let totalValueUSD = 0;
    let totalItems = 0;
    let totalWeight = 0;
    let totalVolume = 0;

    // Calcular data limite para trend mensal
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let recentCotacoes = 0;

    cotacoes.forEach(cotacao => {
      // Status distribution
      const status = cotacao.status || 'desconhecido';
      statusCount[status] = (statusCount[status] || 0) + 1;

      // Totais
      totalValueUSD += Number(cotacao.total_valor_usd) || 0;
      totalItems += Number(cotacao.total_quantidade) || 0;
      totalWeight += Number(cotacao.total_peso_kg) || 0;
      totalVolume += Number(cotacao.total_cbm) || 0;

      // Trend mensal
      const dataAbertura = new Date(cotacao.data_abertura);
      if (dataAbertura >= oneMonthAgo) {
        recentCotacoes++;
      }
    });

    return {
      totalCotacoes: cotacoes.length,
      totalValueUSD,
      totalItems,
      totalWeight,
      totalVolume,
      statusDistribution: statusCount,
      monthlyTrend: (recentCotacoes / cotacoes.length) * 100
    };
  }, [cotacoes]);

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovada':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'rejeitada':
        return { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'enviada':
        return { icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      default:
        return { icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number, unit = '') => {
    return `${new Intl.NumberFormat('pt-BR').format(Math.round(value))}${unit}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cotações</p>
                <p className="text-2xl font-bold">{analytics.totalCotacoes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalValueUSD)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Weight className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Peso Total</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalWeight, ' kg')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">{formatNumber(analytics.totalVolume, ' m³')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Status das Cotações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const percentage = (count / analytics.totalCotacoes) * 100;
              const statusInfo = getStatusInfo(status);
              const Icon = statusInfo.icon;

              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
                        <Icon className={`w-4 h-4 ${statusInfo.color}`} />
                      </div>
                      <span className="text-sm font-medium capitalize">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trend mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cotações do último mês</p>
              <p className="text-lg font-semibold">{analytics.monthlyTrend.toFixed(1)}%</p>
            </div>
            <Badge variant={analytics.monthlyTrend > 50 ? "default" : "secondary"}>
              {analytics.monthlyTrend > 50 ? "Alta atividade" : "Baixa atividade"}
            </Badge>
          </div>
          <Progress value={analytics.monthlyTrend} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
});

CotacoesAnalyticsPanel.displayName = 'CotacoesAnalyticsPanel';