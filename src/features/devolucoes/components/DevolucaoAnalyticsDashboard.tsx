/**
 * 🎯 DASHBOARD DE ANALYTICS AVANÇADO PARA DEVOLUÇÕES
 * Visualizações interativas com métricas e insights
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Package,
  Users,
  Clock,
  Target,
  Award
} from 'lucide-react';
import { DevolucaoMetrics } from '../hooks/useDevolucaoAnalytics';

interface DevolucaoAnalyticsDashboardProps {
  metrics: DevolucaoMetrics;
  className?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300'
];

const DevolucaoAnalyticsDashboard: React.FC<DevolucaoAnalyticsDashboardProps> = ({
  metrics,
  className = ''
}) => {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Target className="h-4 w-4 text-info" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devoluções</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDevolucoes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Todas as devoluções registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Retido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.valorTotalRetido)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total em devoluções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics.taxaResolucao)}</div>
            <Progress value={metrics.taxaResolucao} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Devoluções resolvidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mediaTempoClaim.toFixed(1)} dias</div>
            <p className="text-xs text-muted-foreground">
              Para resolução de claims
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights Automáticos */}
      {metrics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Insights Automáticos
            </CardTitle>
            <CardDescription>
              Análises automáticas baseadas nos seus dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{insight.title}</h4>
                      {insight.value && (
                        <Badge variant={getInsightColor(insight.type) as any}>
                          {insight.value}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos de Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Devoluções */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Devoluções (30 dias)</CardTitle>
            <CardDescription>
              Volume diário de novas devoluções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.tendenciaDevolucoes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência de Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Valores (30 dias)</CardTitle>
            <CardDescription>
              Valor diário retido em devoluções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.tendenciaValor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Valor']} />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status e Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>
              Proporção de devoluções por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.distribuicaoStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {metrics.distribuicaoStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos com Devoluções</CardTitle>
            <CardDescription>
              Produtos com maior número de devoluções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topProdutos.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="produto" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Conta */}
      {metrics.performancePorConta.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance por Conta</CardTitle>
            <CardDescription>
              Taxa de resolução por conta ML
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.performancePorConta.map((conta, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{conta.conta}</span>
                      <Badge variant="outline">
                        {conta.resolvidas}/{conta.total}
                      </Badge>
                    </div>
                    <Progress value={conta.taxa} className="h-2" />
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm font-medium">{formatPercentage(conta.taxa)}</div>
                    <div className="text-xs text-muted-foreground">Taxa</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taxa de Resolução ao Longo do Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Resolução (30 dias)</CardTitle>
          <CardDescription>
            Evolução da taxa de resolução diária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.tendenciaResolucao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Taxa']} />
              <Line 
                type="monotone" 
                dataKey="valor" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevolucaoAnalyticsDashboard;