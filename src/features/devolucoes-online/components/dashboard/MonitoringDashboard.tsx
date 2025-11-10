import React, { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, TrendingUp, Bell, Database } from 'lucide-react';
import { useRealtimeMetrics } from '../../hooks/useRealtimeMetrics';
import { PerformanceTrendChart, ComparisonBarChart } from './PerformanceTrendChart';
import { PerformanceAlertsPanel } from './PerformanceAlertsPanel';
import { PerformanceMetricsDashboard } from './PerformanceMetricsDashboard';
import { PerformanceAuditService } from '../../services/performanceAuditService';

/**
 * SPRINT 3: Dashboard de Monitoramento Completo
 * Integra métricas em tempo real, gráficos de tendência e alertas automáticos
 */

export const MonitoringDashboard = memo(() => {
  const { realtimeData, metrics, refetch } = useRealtimeMetrics();
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar histórico de métricas para gráficos de tendência
  useEffect(() => {
    const loadTrendData = async () => {
      try {
        const history = await PerformanceAuditService.getMetricsHistory(7);
        
        // Agrupar por dia e calcular médias
        const groupedData = history.reduce((acc: any, log: any) => {
          const date = new Date(log.created_at).toLocaleDateString('pt-BR');
          if (!acc[date]) {
            acc[date] = {
              timestamp: date,
              avg_query_time: [],
              fill_rate: [],
              total_records: 0
            };
          }
          
          if (log.action === 'query_performance') {
            acc[date].avg_query_time.push(log.new_values?.value || 0);
          } else if (log.action === 'fill_rate') {
            acc[date].fill_rate.push(log.new_values?.value || 0);
          }
          
          return acc;
        }, {});

        // Calcular médias
        const formatted = Object.values(groupedData).map((day: any) => ({
          timestamp: day.timestamp,
          avg_query_time: day.avg_query_time.length > 0
            ? day.avg_query_time.reduce((a: number, b: number) => a + b, 0) / day.avg_query_time.length
            : 0,
          fill_rate: day.fill_rate.length > 0
            ? day.fill_rate.reduce((a: number, b: number) => a + b, 0) / day.fill_rate.length
            : 0,
          total_records: realtimeData.totalRecords
        }));

        setTrendData(formatted);
      } catch (error) {
        console.error('Erro ao carregar dados de tendência:', error);
      }
    };

    loadTrendData();
  }, [metrics, realtimeData.totalRecords]);

  const handleRefresh = async () => {
    setLoading(true);
    await refetch();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoramento de Performance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dashboard em tempo real - SPRINT 3
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total de Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeData.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Devoluções monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Updates Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{realtimeData.recentUpdates}</span>
              <Badge variant="secondary" className="text-xs">
                Tempo real
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {realtimeData.lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realtimeData.avgQueryTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio de resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{realtimeData.criticalAlerts}</span>
              {realtimeData.criticalAlerts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Ação Necessária
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Queries com performance crítica
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="detailed">Detalhado</TabsTrigger>
        </TabsList>

        {/* Tab: Tempo Real */}
        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceAlertsPanel metrics={metrics} autoAnalyze={true} />
            
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>Métricas atualizadas em tempo real</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Índices Ativos</span>
                    <span className="font-semibold">{metrics?.summary.total_indexes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fill Rate Médio</span>
                    <span className="font-semibold">{metrics?.summary.avg_fill_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Queries Monitoradas</span>
                    <span className="font-semibold">{metrics?.query_performance.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Tendências */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceTrendChart
              data={trendData}
              metric="query_time"
              title="Evolução do Tempo de Query"
              description="Últimos 7 dias"
            />
            <PerformanceTrendChart
              data={trendData}
              metric="fill_rate"
              title="Taxa de Preenchimento JSONB"
              description="Tendência de preenchimento dos campos"
            />
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts">
          <PerformanceAlertsPanel metrics={metrics} autoAnalyze={false} />
        </TabsContent>

        {/* Tab: Detalhado */}
        <TabsContent value="detailed">
          <PerformanceMetricsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
});

MonitoringDashboard.displayName = 'MonitoringDashboard';
