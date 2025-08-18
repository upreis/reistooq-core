// 📈 Widget de Performance de Vendas
// Análises detalhadas de vendas com comparações

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, DollarSign, Target, Calendar,
  BarChart3, PieChart, LineChart, Users
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

interface SalesPerformanceProps {
  timeRange: string;
}

export function SalesPerformanceWidget({ timeRange }: SalesPerformanceProps) {
  const [activeView, setActiveView] = useState('trend');

  // Dados mockados para demonstração
  const salesTrendData = [
    { date: '01/06', vendas: 12000, meta: 15000, pedidos: 45 },
    { date: '02/06', vendas: 15000, meta: 15000, pedidos: 52 },
    { date: '03/06', vendas: 18000, meta: 15000, pedidos: 67 },
    { date: '04/06', vendas: 14000, meta: 15000, pedidos: 48 },
    { date: '05/06', vendas: 22000, meta: 15000, pedidos: 78 },
    { date: '06/06', vendas: 25000, meta: 15000, pedidos: 89 },
    { date: '07/06', vendas: 19000, meta: 15000, pedidos: 61 },
  ];

  const salesByChannelData = [
    { name: 'Online', value: 45, vendas: 50000, color: '#0ea5e9' },
    { name: 'Presencial', value: 30, vendas: 33000, color: '#10b981' },
    { name: 'Marketplace', value: 20, vendas: 22000, color: '#f59e0b' },
    { name: 'Outros', value: 5, vendas: 5500, color: '#ef4444' },
  ];

  const topProductsData = [
    { produto: 'Produto A', vendas: 15000, quantidade: 45 },
    { produto: 'Produto B', vendas: 12000, quantidade: 38 },
    { produto: 'Produto C', vendas: 9500, quantidade: 32 },
    { produto: 'Produto D', vendas: 8200, quantidade: 28 },
    { produto: 'Produto E', vendas: 6800, quantidade: 24 },
  ];

  const salesMetrics = {
    totalSales: 110500,
    totalOrders: 342,
    averageTicket: 323.10,
    conversionRate: 4.2,
    growth: 15.3,
    targetAchievement: 87.5
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Totais</p>
                <p className="text-2xl font-bold">{formatCurrency(salesMetrics.totalSales)}</p>
                <p className="text-xs text-success">+{salesMetrics.growth}% vs período anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{salesMetrics.totalOrders}</p>
                <p className="text-xs text-success">+8.2% vs período anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-success flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(salesMetrics.averageTicket)}</p>
                <p className="text-xs text-warning">+2.1% vs período anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-warning flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{salesMetrics.conversionRate}%</p>
                <p className="text-xs text-success">+0.8% vs período anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-danger flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análises detalhadas */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend">Tendência</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tendência de Vendas
                <Badge variant="outline" className="ml-auto">
                  {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '3 meses'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'vendas' ? formatCurrency(Number(value)) : value,
                        name === 'vendas' ? 'Vendas' : name === 'meta' ? 'Meta' : 'Pedidos'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="vendas" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1}
                      fill="url(#salesGradient)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="meta" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pico de Vendas</p>
                  <p className="text-lg font-bold">{formatCurrency(25000)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Média Diária</p>
                  <p className="text-lg font-bold">{formatCurrency(17857)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Atingimento da Meta</p>
                  <p className="text-lg font-bold text-success">{salesMetrics.targetAchievement}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Vendas por Canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={salesByChannelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                      >
                        {salesByChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {salesByChannelData.map((channel, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }}></div>
                        <span className="text-sm font-medium">{channel.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{channel.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesByChannelData.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{channel.name}</span>
                        <span className="text-sm font-bold">{formatCurrency(channel.vendas)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${channel.value}%`,
                            backgroundColor: channel.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="produto" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="font-semibold">Detalhes dos Produtos</h4>
                {topProductsData.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.produto}</p>
                        <p className="text-sm text-muted-foreground">{product.quantidade} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.vendas)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(product.vendas / product.quantidade)}/un
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}