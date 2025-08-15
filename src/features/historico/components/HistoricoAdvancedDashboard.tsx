// Dashboard analítico avançado com métricas e gráficos
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HistoricoSummary } from '../types/historicoTypes';
import { formatCurrency, formatNumber, formatPercent } from '../utils/historicoFormatters';
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
  ResponsiveContainer,
  Legend
} from 'recharts';

interface HistoricoAdvancedDashboardProps {
  summary?: HistoricoSummary;
  isLoading?: boolean;
  quickStats?: {
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
    crescimentoMensal: number;
  };
}

export function HistoricoAdvancedDashboard({
  summary,
  isLoading = false,
  quickStats
}: HistoricoAdvancedDashboardProps) {

  // Dados mock para demonstração dos gráficos
  const vendasMensais = [
    { mes: 'Jan', vendas: 120, valor: 45000 },
    { mes: 'Fev', vendas: 135, valor: 52000 },
    { mes: 'Mar', vendas: 148, valor: 58000 },
    { mes: 'Abr', vendas: 142, valor: 55000 },
    { mes: 'Mai', vendas: 165, valor: 68000 },
    { mes: 'Jun', vendas: 178, valor: 72000 },
  ];

  const topProdutos = [
    { nome: 'Produto A', quantidade: 45, valor: 18000 },
    { nome: 'Produto B', quantidade: 32, valor: 14500 },
    { nome: 'Produto C', quantidade: 28, valor: 12000 },
    { nome: 'Produto D', quantidade: 24, valor: 9800 },
    { nome: 'Produto E', quantidade: 18, valor: 7200 },
  ];

  const statusDistribuicao = [
    { nome: 'Concluída', valor: 75, color: '#22c55e' },
    { nome: 'Pendente', valor: 15, color: '#f59e0b' },
    { nome: 'Cancelada', valor: 10, color: '#ef4444' },
  ];

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = 'up',
    formatter = (v: any) => v 
  }: {
    title: string;
    value: any;
    change?: number;
    icon: any;
    trend?: 'up' | 'down';
    formatter?: (value: any) => string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{isLoading ? '---' : formatter(value)}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {formatPercent(Math.abs(change))}
            </span>
            <span className="ml-1">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Vendas"
          value={summary?.totalVendas || quickStats?.totalVendas || 0}
          change={12.5}
          icon={ShoppingCart}
          formatter={formatNumber}
        />
        
        <MetricCard
          title="Receita Total"
          value={summary?.valorTotalVendas || quickStats?.valorTotal || 0}
          change={8.2}
          icon={DollarSign}
          formatter={formatCurrency}
        />
        
        <MetricCard
          title="Ticket Médio"
          value={summary?.ticketMedio || quickStats?.ticketMedio || 0}
          change={-2.1}
          icon={TrendingUp}
          trend="down"
          formatter={formatCurrency}
        />
        
        <MetricCard
          title="Clientes Únicos"
          value={summary?.clientesUnicos || 0}
          change={15.3}
          icon={Users}
          formatter={formatNumber}
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Evolução de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas</CardTitle>
            <CardDescription>Vendas e receita por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={vendasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'vendas' ? formatNumber(value) : formatCurrency(value),
                    name === 'vendas' ? 'Vendas' : 'Receita'
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="vendas" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.3}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="valor" 
                  stackId="2"
                  stroke="hsl(var(--destructive))" 
                  fill="hsl(var(--destructive))" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProdutos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'quantidade' ? formatNumber(value) : formatCurrency(value),
                    name === 'quantidade' ? 'Quantidade' : 'Valor'
                  ]}
                />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Distribuição de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusDistribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {statusDistribuicao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Métricas de Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Taxa de Conversão</span>
                <span>68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Satisfação do Cliente</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tempo Médio de Entrega</span>
                <span>3.2 dias</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Insights Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">📈</Badge>
              <span className="text-sm">Vendas cresceram 12% este mês</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">🎯</Badge>
              <span className="text-sm">Meta mensal atingida em 85%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">⭐</Badge>
              <span className="text-sm">São Paulo é a região top</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary">📦</Badge>
              <span className="text-sm">{summary?.produtosUnicos || 0} produtos únicos vendidos</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}