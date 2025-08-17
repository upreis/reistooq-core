// 🎯 ENHANCED - Hub de integrações melhorado
// Advanced integrations dashboard with real-time monitoring

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  AlertTriangle, 
  Settings, 
  Activity, 
  BarChart3,
  Shield,
  RefreshCw,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  Play
} from 'lucide-react';

import { useEnhancedIntegrationCore } from '../hooks/useEnhancedIntegrationCore';
import { EnhancedIntegration, Provider, IntegrationStatus } from '../types/enhanced-integrations.types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const EnhancedIntegrationsHub: React.FC = () => {
  const {
    integrations,
    loading,
    error,
    metrics,
    alerts,
    refreshIntegrations,
    connectProvider,
    disconnectProvider,
    testConnection,
    syncData,
    pauseIntegration,
    resumeIntegration,
    exportConfiguration,
    importConfiguration
  } = useEnhancedIntegrationCore();

  // ========== LOCAL STATE ==========
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IntegrationStatus>('all');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // ========== COMPUTED VALUES ==========
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || integration.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [integrations, searchTerm, statusFilter]);

  const overallHealth = useMemo(() => {
    if (integrations.length === 0) return 0;
    const connectedCount = integrations.filter(i => i.status === 'connected').length;
    return Math.round((connectedCount / integrations.length) * 100);
  }, [integrations]);

  const alertsCount = alerts.filter(alert => !alert.acknowledged).length;

  // ========== EVENT HANDLERS ==========

  const handleConnect = useCallback(async (provider: Provider) => {
    setSelectedProvider(provider);
    setShowConfigPanel(true);
  }, []);

  const handleDisconnect = useCallback(async (provider: Provider) => {
    await disconnectProvider(provider);
  }, [disconnectProvider]);

  const handleTest = useCallback(async (provider: Provider) => {
    await testConnection(provider);
  }, [testConnection]);

  const handleSync = useCallback(async (provider: Provider) => {
    await syncData(provider, { force: true, incremental: false, entities: [] });
  }, [syncData]);

  const handlePause = useCallback(async (provider: Provider) => {
    await pauseIntegration(provider);
  }, [pauseIntegration]);

  const handleResume = useCallback(async (provider: Provider) => {
    await resumeIntegration(provider);
  }, [resumeIntegration]);

  const handleExport = useCallback(async () => {
    try {
      const config = await exportConfiguration();
      const blob = new Blob([config], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `integrations-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportConfiguration]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      await importConfiguration(content);
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [importConfiguration]);

  // ========== RENDER HELPERS ==========

  const getStatusColor = (status: IntegrationStatus): string => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'disconnected': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting': return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'syncing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'disconnected': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações avançadas...</span>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          {error.message}
          <Button variant="outline" size="sm" onClick={refreshIntegrations}>
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Integrações Avançadas</h1>
            <p className="text-muted-foreground">
              Sistema de integrações com monitoramento em tempo real e analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </span>
            </Button>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImport}
            />
          </label>
          <Button onClick={refreshIntegrations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ========== STATUS OVERVIEW ========== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallHealth}%</div>
            <Progress value={overallHealth} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {integrations.filter(i => i.status === 'connected').length} de {integrations.length} conectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{alertsCount}</div>
            <p className="text-xs text-muted-foreground">
              {alertsCount > 0 ? 'Requer atenção' : 'Tudo funcionando'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sincronizações</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.reduce((sum, i) => sum + (metrics[i.provider]?.successful_requests || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(Object.values(metrics).reduce((sum, m) => sum + (m?.average_response_time || 0), 0) / Object.keys(metrics).length)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de resposta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* ========== INTEGRATIONS TAB ========== */}
        <TabsContent value="integrations">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar integrações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="connected">Conectadas</SelectItem>
                  <SelectItem value="disconnected">Desconectadas</SelectItem>
                  <SelectItem value="error">Com Erro</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Integration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                      </div>
                      <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                        {integration.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Health Score */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Health Score</span>
                        <span>{integration.health_score}%</span>
                      </div>
                      <Progress value={integration.health_score} />
                    </div>

                    {/* Metrics */}
                    {metrics[integration.provider] && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Uptime:</span>
                          <span className="ml-1 font-medium">
                            {metrics[integration.provider].uptime_percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Resp. Time:</span>
                          <span className="ml-1 font-medium">
                            {metrics[integration.provider].average_response_time}ms
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Last Sync */}
                    {integration.last_sync && (
                      <div className="text-sm text-muted-foreground">
                        Última sync: {new Date(integration.last_sync).toLocaleString()}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {integration.status === 'connected' ? (
                        <>
                          <Button size="sm" onClick={() => handleTest(integration.provider)}>
                            Testar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSync(integration.provider)}>
                            Sync
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePause(integration.provider)}
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDisconnect(integration.provider)}
                          >
                            Desconectar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => handleConnect(integration.provider)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Conectar
                          </Button>
                          {integration.status === 'disconnected' && integration.enabled && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleResume(integration.provider)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ========== MONITORING TAB ========== */}
        <TabsContent value="monitoring">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status em Tempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(integration.status)}`} />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {metrics[integration.provider] && (
                          <>
                            <span>{metrics[integration.provider].average_response_time}ms</span>
                            <span>•</span>
                            <span>{metrics[integration.provider].uptime_percentage.toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum alerta ativo
                  </p>
                ) : (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            {alert.severity}
                          </Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.triggered_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== ANALYTICS TAB ========== */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics avançados em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== SECURITY TAB ========== */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Painel de segurança em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};