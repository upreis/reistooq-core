import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Database, Zap, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';
import { IndexHealthCard } from './IndexHealthCard';

/**
 * SPRINT 2: Dashboard de Validação de Performance dos Índices JSONB
 * Mostra métricas em tempo real de uso, eficiência e fill rate
 */
export const PerformanceMetricsDashboard = memo(() => {
  const { data: metrics, isLoading, refetch, isFetching } = usePerformanceMetrics(false);

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 100) return { label: 'Excelente', color: 'text-green-500', variant: 'default' as const };
    if (avgTime < 300) return { label: 'Bom', color: 'text-yellow-500', variant: 'secondary' as const };
    return { label: 'Lento', color: 'text-red-500', variant: 'destructive' as const };
  };

  const getFillRateStatus = (rate: number) => {
    if (rate >= 80) return { icon: CheckCircle2, color: 'text-green-500' };
    if (rate >= 50) return { icon: AlertCircle, color: 'text-yellow-500' };
    return { icon: AlertCircle, color: 'text-red-500' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Analisando performance dos índices...</p>
        </div>
      </div>
    );
  }

  const perfStatus = getPerformanceStatus(metrics?.summary.avg_query_time || 0);

  return (
    <div className="space-y-6">
      {/* Header com resumo geral */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-sm text-muted-foreground">
            Validação de índices JSONB - SPRINT 2
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Índices Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.total_indexes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Índices JSONB criados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tempo Médio de Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {metrics?.summary.avg_query_time.toFixed(1) || 0}ms
              </span>
              <Badge variant={perfStatus.variant} className="text-xs">
                {perfStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Performance geral do sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Fill Rate Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.summary.avg_fill_rate.toFixed(1) || 0}%
            </div>
            <Progress value={metrics?.summary.avg_fill_rate || 0} className="h-1 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de preenchimento JSONB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="indexes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="indexes">Índices</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="fillrate">Fill Rate</TabsTrigger>
        </TabsList>

        {/* Tab de Índices */}
        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saúde dos Índices JSONB</CardTitle>
              <CardDescription>
                Estatísticas de uso e eficiência dos índices criados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics?.index_usage.map((stat) => (
                  <IndexHealthCard key={stat.index_name} stats={stat} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Performance de Queries */}
        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Queries</CardTitle>
              <CardDescription>
                Tempo de execução das queries críticas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.query_performance.map((query) => {
                  const status = getPerformanceStatus(query.avg_execution_time_ms);
                  return (
                    <div
                      key={query.query_type}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{query.query_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {query.uses_index ? '✓ Usando índice' : '⚠ Sem índice'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${status.color}`}>
                          {query.avg_execution_time_ms.toFixed(1)}ms
                        </p>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Fill Rate */}
        <TabsContent value="fillrate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Preenchimento JSONB</CardTitle>
              <CardDescription>
                Porcentagem de registros com dados em cada campo JSONB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.jsonb_fill_rates.map((field) => {
                  const status = getFillRateStatus(field.fill_rate_percentage);
                  const StatusIcon = status.icon;
                  return (
                    <div key={field.field_name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          <span className="text-sm font-medium">{field.field_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold">
                            {field.fill_rate_percentage.toFixed(1)}%
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {field.filled_records}/{field.total_records}
                          </p>
                        </div>
                      </div>
                      <Progress value={field.fill_rate_percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer com timestamp */}
      <div className="text-center text-xs text-muted-foreground">
        Última atualização: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString('pt-BR') : '-'}
      </div>
    </div>
  );
});

PerformanceMetricsDashboard.displayName = 'PerformanceMetricsDashboard';
