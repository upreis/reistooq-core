/**
 * 📊 DASHBOARD DE MÉTRICAS EM TEMPO REAL
 * Analytics avançado + gráficos interativos
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface MetricsData {
  // Métricas principais
  totalPedidos: number;
  pedidosHoje: number;
  receitaTotal: number;
  receitaHoje: number;
  ticketMedio: number;
  
  // Performance
  mapeamentoRate: number;
  processamentoPendente: number;
  alertasAtivos: number;
  
  // Tendências (últimos 7 dias)
  tendenciaPedidos: Array<{ date: string; pedidos: number; receita: number }>;
  
  // Distribuições
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  cidadesTop: Array<{ cidade: string; pedidos: number; receita: number }>;
  
  // Health metrics
  integrationHealth: number;
  systemPerformance: number;
  dataQuality: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

function MetricCard({ title, value, change, changeLabel, icon, trend = 'neutral', className }: MetricCardProps) {
  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground'
  }[trend];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(change)}%</span>
              {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-primary/10">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function HealthIndicator({ label, value, target = 95 }: { label: string; value: number; target?: number }) {
  const status = value >= target ? 'excellent' : value >= target * 0.8 ? 'good' : 'warning';
  const color = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[status];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("font-bold", 
          status === 'excellent' ? 'text-green-600' : 
          status === 'good' ? 'text-blue-600' : 'text-yellow-600'
        )}>
          {value.toFixed(1)}%
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export function MetricsDashboard({ 
  data, 
  onRefresh, 
  isLoading = false 
}: { 
  data?: MetricsData; 
  onRefresh?: () => void;
  isLoading?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Mock data para demonstração
  const mockData: MetricsData = useMemo(() => ({
    totalPedidos: 15847,
    pedidosHoje: 342,
    receitaTotal: 1245680.50,
    receitaHoje: 28749.30,
    ticketMedio: 78.65,
    mapeamentoRate: 94.2,
    processamentoPendente: 23,
    alertasAtivos: 3,
    
    tendenciaPedidos: [
      { date: '01/01', pedidos: 280, receita: 22400 },
      { date: '02/01', pedidos: 320, receita: 25600 },
      { date: '03/01', pedidos: 290, receita: 23200 },
      { date: '04/01', pedidos: 350, receita: 28000 },
      { date: '05/01', pedidos: 380, receita: 30400 },
      { date: '06/01', pedidos: 310, receita: 24800 },
      { date: '07/01', pedidos: 342, receita: 28749 },
    ],
    
    statusDistribution: [
      { name: 'Entregue', value: 68, color: '#22c55e' },
      { name: 'Enviado', value: 18, color: '#3b82f6' },
      { name: 'Processando', value: 8, color: '#f59e0b' },
      { name: 'Cancelado', value: 6, color: '#ef4444' },
    ],
    
    cidadesTop: [
      { cidade: 'São Paulo', pedidos: 1247, receita: 98760 },
      { cidade: 'Rio de Janeiro', pedidos: 823, receita: 65840 },
      { cidade: 'Belo Horizonte', pedidos: 567, receita: 45360 },
      { cidade: 'Salvador', pedidos: 432, receita: 34560 },
      { cidade: 'Curitiba', pedidos: 389, receita: 31120 },
    ],
    
    integrationHealth: 98.5,
    systemPerformance: 96.2,
    dataQuality: 92.8,
  }), []);

  const metricsData = data || mockData;

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simular refresh
    setLastUpdate(new Date());
    onRefresh?.();
    setRefreshing(false);
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Métricas</h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Pedidos"
          value={metricsData.totalPedidos.toLocaleString()}
          change={12.5}
          changeLabel="vs mês anterior"
          icon={<Package className="h-6 w-6 text-primary" />}
          trend="up"
        />
        
        <MetricCard
          title="Pedidos Hoje"
          value={metricsData.pedidosHoje}
          change={-3.2}
          changeLabel="vs ontem"
          icon={<Activity className="h-6 w-6 text-primary" />}
          trend="down"
        />
        
        <MetricCard
          title="Receita Total"
          value={`R$ ${(metricsData.receitaTotal / 1000).toFixed(0)}k`}
          change={8.7}
          changeLabel="vs mês anterior"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          trend="up"
        />
        
        <MetricCard
          title="Ticket Médio"
          value={`R$ ${metricsData.ticketMedio.toFixed(2)}`}
          change={2.3}
          changeLabel="vs semana anterior"
          icon={<Target className="h-6 w-6 text-primary" />}
          trend="up"
        />
      </div>

      {/* Health Indicators */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Saúde do Sistema</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthIndicator
            label="Integrações"
            value={metricsData.integrationHealth}
          />
          <HealthIndicator
            label="Performance"
            value={metricsData.systemPerformance}
          />
          <HealthIndicator
            label="Qualidade dos Dados"
            value={metricsData.dataQuality}
            target={90}
          />
        </div>

        {metricsData.alertasAtivos > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {metricsData.alertasAtivos} alerta(s) ativo(s) • 
                {metricsData.processamentoPendente} pedidos pendentes de processamento
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Gráficos e Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="status">Distribuição</TabsTrigger>
          <TabsTrigger value="geography">Geografia</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tendência de Pedidos (7 dias)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsData.tendenciaPedidos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="pedidos" orientation="left" />
                <YAxis yAxisId="receita" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'pedidos' ? `${value} pedidos` : `R$ ${Number(value).toLocaleString()}`,
                    name === 'pedidos' ? 'Pedidos' : 'Receita'
                  ]}
                />
                <Line 
                  yAxisId="pedidos"
                  type="monotone" 
                  dataKey="pedidos" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
                <Line 
                  yAxisId="receita"
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Status dos Pedidos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metricsData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metricsData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentual']} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2 mt-4">
                {metricsData.statusDistribution.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">{status.name}</span>
                    </div>
                    <span className="text-sm font-medium">{status.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance de Mapeamento</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {metricsData.mapeamentoRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Taxa de Mapeamento Atual
                  </p>
                </div>
                
                <Progress value={metricsData.mapeamentoRate} className="h-3" />
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(metricsData.totalPedidos * metricsData.mapeamentoRate / 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">Mapeados</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(metricsData.totalPedidos * (100 - metricsData.mapeamentoRate) / 100)}
                    </div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Cidades por Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metricsData.cidadesTop}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cidade" />
                <YAxis yAxisId="pedidos" orientation="left" />
                <YAxis yAxisId="receita" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'pedidos' ? `${value} pedidos` : `R$ ${Number(value).toLocaleString()}`,
                    name === 'pedidos' ? 'Pedidos' : 'Receita'
                  ]}
                />
                <Bar yAxisId="pedidos" dataKey="pedidos" fill="#3b82f6" />
                <Bar yAxisId="receita" dataKey="receita" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MetricsDashboard;