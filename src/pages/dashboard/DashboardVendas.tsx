import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, DollarSign, TrendingUp, Users, Package, MapPin, Calendar, BarChart3 } from 'lucide-react';
import { SalesFilters, SalesFilterState } from '@/features/dashboard/components/SalesFilters';
import { useSalesAnalytics } from '@/features/dashboard/hooks/useSalesAnalytics';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <SalesFilters onFilterChange={handleFilterChange} onReset={handleReset} />

      {/* Cards de Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Período</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendas.mes.toLocaleString()}</div>
            <p className={`text-xs ${vendas.crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {vendas.crescimentoMensal >= 0 ? '+' : ''}{vendas.crescimentoMensal.toFixed(1)}% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valorTotalMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total do período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesUnicos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos processados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução de Vendas */}
      <Card>
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

      {/* Análise Geográfica e Produtos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vendas por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Vendas por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadosChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {estadosChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {estados.slice(0, 5).map((estado, index) => (
                <div key={estado.uf} className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {estado.uf}
                  </span>
                  <span className="font-medium">
                    {estado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
