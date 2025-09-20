import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Monitor, 
  RefreshCw,
  Server,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { performHealthCheck, HealthStatus } from '@/utils/health-check';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { config } from '@/config/environment';

export const SystemDashboard = () => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { 
    data: healthStatus, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: performHealthCheck,
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
    refetchOnWindowFocus: false
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'degraded':
      case 'warn':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
      case 'fail':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle className="h-4 w-4" />;
      case 'degraded':
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />;
      case 'down':
      case 'fail':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
        <span className="ml-3">Verificando saúde do sistema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao verificar sistema</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível obter o status do sistema.
        </p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard do Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da saúde do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Ativo' : 'Inativo'}
            </Button>
          </div>
          
          <Button onClick={() => refetch()} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Status Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(healthStatus?.status || 'unknown')}
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(healthStatus?.status || 'unknown')}>
                    {healthStatus?.status?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Última verificação: {healthStatus?.timestamp ? 
                      new Date(healthStatus.timestamp).toLocaleTimeString() : 'N/A'
                    }
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Sistema {healthStatus?.status === 'healthy' ? 'funcionando normalmente' : 
                           healthStatus?.status === 'degraded' ? 'com alguns problemas' : 
                           'com problemas críticos'}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">
                {healthStatus?.uptime ? Math.round(healthStatus.uptime / 1000 / 60) : 0}m
              </div>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Memória</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {healthStatus?.performance.memoryUsage || 0}MB
              </div>
              <Progress 
                value={(healthStatus?.performance.memoryUsage || 0) / 10} 
                className="mt-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Carregamento</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {healthStatus?.performance.loadTime || 0}ms
              </div>
              <p className="text-xs text-muted-foreground">
                {(healthStatus?.performance.loadTime || 0) < 3000 ? 'Rápido' : 'Lento'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">API Latência</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {healthStatus?.performance.apiLatency || 0}ms
              </div>
              <p className="text-xs text-muted-foreground">
                {(healthStatus?.performance.apiLatency || 0) < 1000 ? 'Boa' : 'Alta'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Taxa de Erro</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {healthStatus?.performance.errorRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {(healthStatus?.performance.errorRate || 0) < 5 ? 'Normal' : 'Alta'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Checks */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">Verificações</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthStatus?.checks && Object.entries(healthStatus.checks).map(([key, check]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {key === 'supabase' && <Database className="h-4 w-4" />}
                      {key === 'apis' && <Server className="h-4 w-4" />}
                      {key === 'integrations' && <Zap className="h-4 w-4" />}
                      {key === 'browser' && <Monitor className="h-4 w-4" />}
                      {key === 'config' && <Activity className="h-4 w-4" />}
                      {key === 'permissions' && <CheckCircle className="h-4 w-4" />}
                      <span className="font-medium capitalize">{key}</span>
                    </div>
                    <Badge className={getStatusColor(check.status)}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {check.responseTime && (
                    <p className="text-sm text-muted-foreground">
                      Tempo de resposta: {check.responseTime}ms
                    </p>
                  )}
                  
                  {check.error && (
                    <p className="text-sm text-destructive mt-2">
                      {check.error}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Última verificação: {new Date(check.lastChecked).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Aplicação</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Versão:</dt>
                      <dd>{healthStatus?.version}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Ambiente:</dt>
                      <dd>{config.app.environment}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Uptime:</dt>
                      <dd>{healthStatus?.uptime ? Math.round(healthStatus.uptime / 1000 / 60) : 0} minutos</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Performance</h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Memória JS:</dt>
                      <dd>{healthStatus?.performance.memoryUsage || 0} MB</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Load Time:</dt>
                      <dd>{healthStatus?.performance.loadTime || 0} ms</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">API Latência:</dt>
                      <dd>{healthStatus?.performance.apiLatency || 0} ms</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {healthStatus?.checks && Object.entries(healthStatus.checks).map(([key, check]) => (
                check.details && (
                  <div key={key}>
                    <h4 className="font-medium mb-2 capitalize">{key} - Detalhes</h4>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Aplicação</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Nome:</dt>
                      <dd className="font-mono">{config.app.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Base URL:</dt>
                      <dd className="font-mono text-xs break-all">{config.app.baseUrl}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email Suporte:</dt>
                      <dd className="font-mono">{config.app.supportEmail}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Features</h4>
                  <div className="space-y-2">
                    {Object.entries(config.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <Badge variant={enabled ? "default" : "secondary"}>
                          {enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">API Configuration</h4>
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Timeout:</dt>
                    <dd>{config.api.timeout}ms</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Retry Attempts:</dt>
                    <dd>{config.api.retryAttempts}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Rate Limit:</dt>
                    <dd>{config.api.rateLimit.requests} req/{config.api.rateLimit.windowMs}ms</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};