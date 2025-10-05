import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShoppingCart, DollarSign, TrendingUp, Users, Package, MapPin, 
  Calendar, BarChart3, CreditCard, TrendingDown, Globe 
} from 'lucide-react';
import { SalesFilters, SalesFilterState } from '@/features/dashboard/components/SalesFilters';
import { useSalesAnalytics } from '@/features/dashboard/hooks/useSalesAnalytics';
import { 
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, 
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrazilMap } from '@/components/dashboard/BrazilMap';
import { SalesStatsCard } from '@/components/dashboard/SalesStatsCard';
import { CongratualtionsWidget } from '@/components/dashboard/CongratulatoinsWidget';

export default function DashboardVendas() {
  const [filters, setFilters] = useState<SalesFilterState>({ periodo: 'mes' });
  const { analytics, isLoading, refetch } = useSalesAnalytics({
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim
  });

  const handleFilterChange = (newFilters: SalesFilterState) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({ periodo: 'mes' });
    refetch();
  };

  // Métricas principais
  const vendas = analytics?.vendas || { hoje: 0, ontem: 0, semana: 0, mes: 0, crescimentoDiario: 0, crescimentoSemanal: 0, crescimentoMensal: 0 };
  const topProdutos = analytics?.produtos.topVendidos || [];
  const estados = analytics?.geografico.estados || [];
  const cidades = analytics?.geografico.cidades || [];
  const temporal = analytics?.temporal.diario || [];

  // Calcular valores totais
  const valorTotalMes = temporal.reduce((sum, item) => sum + item.valor, 0);
  const ticketMedio = temporal.length > 0 ? valorTotalMes / temporal.reduce((sum, item) => sum + item.vendas, 0) : 0;
  const clientesUnicos = temporal.reduce((sum, item) => sum + item.vendas, 0);

  // Preparar dados para gráficos
  const chartColors = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6'
  };

  const COLORS = [
    chartColors.primary,
    chartColors.secondary,
    chartColors.accent,
    chartColors.success,
    chartColors.warning,
    chartColors.danger,
    chartColors.info,
    '#8b5cf6',
    '#ec4899',
    '#14b8a6'
  ];

  // Dados para gráfico de vendas por estado (Pie Chart)
  const estadosChartData = estados.slice(0, 8).map((estado, index) => ({
    name: estado.uf,
    value: estado.valor,
    vendas: estado.vendas,
    fill: COLORS[index % COLORS.length]
  }));

  // Dados para gráfico temporal (Line Chart)
  const temporalChartData = temporal.slice(-30).map(item => ({
    data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    vendas: item.vendas,
    valor: item.valor
  }));

  // Dados para top produtos (Bar Chart)
  const produtosChartData = topProdutos.slice(0, 10).map(produto => ({
    nome: produto.nome.length > 30 ? produto.nome.substring(0, 30) + '...' : produto.nome,
    quantidade: produto.quantidade,
    valor: produto.valor
  }));

  // Dados para top cidades (Bar Chart)
  const cidadesChartData = cidades.slice(0, 10).map(cidade => ({
    nome: `${cidade.cidade} - ${cidade.uf}`,
    vendas: cidade.vendas,
    valor: cidade.valor
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Preparar dados para mini gráficos
  const miniChartData = temporal.slice(-7).map(item => ({ value: item.valor }));
  const ordersChartData = temporal.slice(-7).map(item => ({ value: item.vendas }));
  
  // Stats para widget de congratulações
  const congratsStats = {
    newOrders: Math.floor(vendas.hoje * 0.6),
    onHold: Math.floor(vendas.hoje * 0.15),
    delivered: Math.floor(vendas.hoje * 0.25)
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <SalesFilters onFilterChange={handleFilterChange} onReset={handleReset} />

      {/* Widget de Congratulações */}
      <CongratualtionsWidget
        userName="Usuário"
        salesGrowth={vendas.crescimentoDiario}
        stats={congratsStats}
        chartData={miniChartData}
      />

      {/* Cards de Métricas Principais com Mini Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SalesStatsCard
          title="Faturamento Total"
          value={valorTotalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          icon={DollarSign}
          trend={{ value: vendas.crescimentoMensal, label: 'vs período anterior' }}
          iconBgClass="bg-emerald-500/10 text-emerald-500"
          miniChart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miniChartData}>
                <defs>
                  <linearGradient id="miniGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(142 76% 36%)" fill="url(#miniGradient1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          }
        />

        <SalesStatsCard
          title="Total de Vendas"
          value={vendas.mes.toLocaleString()}
          icon={ShoppingCart}
          trend={{ value: vendas.crescimentoMensal, label: 'vs período anterior' }}
          subtitle="Últimos 7 dias"
          iconBgClass="bg-blue-500/10 text-blue-500"
          miniChart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ordersChartData}>
                <defs>
                  <linearGradient id="miniGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="hsl(217 91% 60%)" fill="url(#miniGradient2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          }
        />

        <SalesStatsCard
          title="Ticket Médio"
          value={ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={TrendingUp}
          subtitle="Valor médio por venda"
          iconBgClass="bg-amber-500/10 text-amber-500"
        />

        <SalesStatsCard
          title="Total de Pedidos"
          value={clientesUnicos.toLocaleString()}
          icon={Package}
          subtitle="Pedidos processados"
          iconBgClass="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Gráfico de Evolução de Vendas + Mapa do Brasil */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Evolução de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="valor" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="valor">Faturamento</TabsTrigger>
              <TabsTrigger value="quantidade">Quantidade</TabsTrigger>
            </TabsList>
            <TabsContent value="valor" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={temporalChartData}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                    labelClassName="text-foreground"
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke={chartColors.primary} 
                    fillOpacity={1} 
                    fill="url(#colorValor)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="quantidade" className="mt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={temporalChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Vendas']}
                    labelClassName="text-foreground"
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke={chartColors.secondary} 
                    strokeWidth={2}
                    dot={{ fill: chartColors.secondary, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

        {/* Mapa do Brasil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Vendas no Brasil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BrazilMap data={estados} />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Maior concentração</span>
                <span className="flex items-center gap-2">
                  <div className="h-3 w-8 bg-primary rounded" />
                  <span>Alto</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Menor concentração</span>
                <span className="flex items-center gap-2">
                  <div className="h-3 w-8 bg-primary/20 rounded" />
                  <span>Baixo</span>
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              {estados.slice(0, 5).map((estado, index) => (
                <div key={estado.uf} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium">{estado.uf}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-xs">
                      {estado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-muted-foreground">{estado.vendas} vendas</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Produtos e Pagamentos */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="nome" type="category" width={150} className="text-xs" />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === 'quantidade') return [value, 'Quantidade'];
                    return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento'];
                  }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="quantidade" fill={chartColors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Cidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Cidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cidades.slice(0, 10).map((cidade, index) => (
                <div key={`${cidade.cidade}-${cidade.uf}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{cidade.cidade} - {cidade.uf}</div>
                      <div className="text-xs text-muted-foreground">{cidade.vendas} vendas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {cidade.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Top Produtos com Detalhes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalhes dos Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProdutos.slice(0, 10).map((produto, index) => (
                <div key={produto.sku} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{produto.nome}</div>
                      <div className="text-xs text-muted-foreground">SKU: {produto.sku}</div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-medium">
                      {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-xs text-muted-foreground">{produto.quantidade} unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
