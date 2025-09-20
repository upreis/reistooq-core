// F6.3: Dashboard de monitoramento do sistema
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePerformanceStore } from '@/stores/performanceStore';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemHealthDashboard() {
  const {
    apiCalls,
    pageLoads,
    errors,
    userActions,
    resetMetrics,
    getHealthStatus
  } = usePerformanceStore();

  const healthStatus = getHealthStatus();
  const errorRate = apiCalls.total > 0 ? ((apiCalls.failed / apiCalls.total) * 100).toFixed(1) : '0';
  const successRate = apiCalls.total > 0 ? ((apiCalls.successful / apiCalls.total) * 100).toFixed(1) : '100';

  const getHealthBadge = () => {
    switch (healthStatus) {
      case 'healthy':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Saudável</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Atenção</Badge>;
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Crítico</Badge>;
    }
  };

  const exportMetrics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      apiCalls,
      pageLoads,
      errors,
      userActions,
      healthStatus
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-metrics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento do Sistema</h1>
          <p className="text-muted-foreground">Status de saúde e métricas de performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Métricas
          </Button>
          <Button variant="outline" onClick={resetMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status Geral do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status de Saúde</p>
              {getHealthBadge()}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Última Verificação</p>
              <p className="text-sm font-mono">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total de Chamadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiCalls.total}</div>
            <p className="text-xs text-muted-foreground">
              {apiCalls.successful} sucessos, {apiCalls.failed} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              parseFloat(successRate) >= 95 ? "text-green-600" : 
              parseFloat(successRate) >= 90 ? "text-yellow-600" : "text-red-600"
            )}>
              {successRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de erro: {errorRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              apiCalls.avgResponseTime <= 1000 ? "text-green-600" : 
              apiCalls.avgResponseTime <= 3000 ? "text-yellow-600" : "text-red-600"
            )}>
              {apiCalls.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta da API
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              errors.total === 0 ? "text-green-600" : 
              errors.total <= 5 ? "text-yellow-600" : "text-red-600"
            )}>
              {errors.total}
            </div>
            {errors.lastError && (
              <p className="text-xs text-muted-foreground truncate">
                Último: {errors.lastError.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userActions.clicks}</div>
              <p className="text-sm text-muted-foreground">Cliques</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userActions.searches}</div>
              <p className="text-sm text-muted-foreground">Pesquisas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userActions.exports}</div>
              <p className="text-sm text-muted-foreground">Exportações</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carregamento de Páginas */}
      <Card>
        <CardHeader>
          <CardTitle>Performance de Carregamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{pageLoads.count}</div>
              <p className="text-sm text-muted-foreground">Total de Carregamentos</p>
            </div>
            <div>
              <div className={cn(
                "text-2xl font-bold",
                pageLoads.avgLoadTime <= 2000 ? "text-green-600" : 
                pageLoads.avgLoadTime <= 5000 ? "text-yellow-600" : "text-red-600"
              )}>
                {pageLoads.avgLoadTime}ms
              </div>
              <p className="text-sm text-muted-foreground">Tempo Médio de Carregamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}