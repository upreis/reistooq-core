// 🎯 Dashboard Inteligente - Sistema avançado de métricas e insights
// Componente principal com widgets inteligentes e alertas automáticos

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign,
  ShoppingCart, Users, Calendar, Clock, Eye, BarChart3,
  Target, Zap, Bell, Settings, Filter, Download, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import { AdvancedMetricsWidget } from "./widgets/AdvancedMetricsWidget";
import { InventoryAnalysisWidget } from "./widgets/InventoryAnalysisWidget";
import { SalesPerformanceWidget } from "./widgets/SalesPerformanceWidget";
import { AlertsWidget } from "./widgets/AlertsWidget";
import { QuickActionsWidget } from "./widgets/QuickActionsWidget";
import { LiveMetricsWidget } from "./widgets/LiveMetricsWidget";

interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

export function IntelligentDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { metrics, loading, refresh } = useAnalytics(timeRange);

  // Simulação de alertas inteligentes
  useEffect(() => {
    const mockAlerts: DashboardAlert[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Estoque Crítico',
        message: '15 produtos com estoque abaixo do mínimo',
        timestamp: new Date(),
        actionRequired: true
      },
      {
        id: '2',
        type: 'warning',
        title: 'Queda nas Vendas',
        message: 'Vendas 12% abaixo da média semanal',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        actionRequired: false
      },
      {
        id: '3',
        type: 'info',
        title: 'Novo Pedido',
        message: 'Pedido #12345 aguardando processamento',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        actionRequired: true
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Bell className="h-4 w-4 text-info" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Carregando Dashboard Inteligente</h3>
            <p className="text-muted-foreground">Analisando métricas e gerando insights...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Inteligente</h1>
          <p className="text-muted-foreground">Insights em tempo real e métricas avançadas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 3 meses</option>
            <option value="1y">Último ano</option>
          </select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alertas críticos no topo */}
      {alerts.filter(a => a.type === 'critical').length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Alertas Críticos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.filter(a => a.type === 'critical').map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-background rounded-md">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                {alert.actionRequired && (
                  <Button size="sm" variant="destructive">Resolver</Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Widgets principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas em tempo real */}
          <LiveMetricsWidget metrics={metrics} />
          
          {/* Grid de widgets principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AdvancedMetricsWidget timeRange={timeRange} />
            <QuickActionsWidget />
            <AlertsWidget alerts={alerts} />
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <SalesPerformanceWidget timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryAnalysisWidget />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Preditiva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Previsão de Vendas</h4>
                    <p className="text-2xl font-bold text-primary">+23%</p>
                    <p className="text-sm text-muted-foreground">Próximos 30 dias</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Produtos em Alta</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Produto A</span>
                        <Badge variant="outline">+45%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Produto B</span>
                        <Badge variant="outline">+32%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metas e Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Meta de Vendas Mensal</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Produtos Cadastrados</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}