// 📦 Widget de Análise de Estoque
// Análises avançadas de estoque e predições

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Target, BarChart3, PieChart, Zap, Calculator
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, LineChart, Line
} from 'recharts';

export function InventoryAnalysisWidget() {
  const [activeTab, setActiveTab] = useState('overview');

  // Dados mockados para demonstração
  const stockLevelsData = [
    { categoria: 'Eletrônicos', estoque: 85, minimo: 20, maximo: 100, status: 'ok' },
    { categoria: 'Roupas', estoque: 15, minimo: 20, maximo: 80, status: 'baixo' },
    { categoria: 'Casa', estoque: 95, minimo: 25, maximo: 100, status: 'alto' },
    { categoria: 'Livros', estoque: 5, minimo: 15, maximo: 60, status: 'critico' },
    { categoria: 'Brinquedos', estoque: 45, minimo: 30, maximo: 70, status: 'ok' },
  ];

  const movementTrendData = [
    { mes: 'Jan', entrada: 450, saida: 380, saldo: 70 },
    { mes: 'Fev', entrada: 520, saida: 420, saldo: 100 },
    { mes: 'Mar', entrada: 380, saida: 480, saldo: -100 },
    { mes: 'Abr', entrada: 600, saida: 520, saldo: 80 },
    { mes: 'Mai', entrada: 480, saida: 580, saldo: -100 },
    { mes: 'Jun', entrada: 650, saida: 490, saldo: 160 },
  ];

  const turnoverData = [
    { produto: 'Produto A', giro: 12.5, dias: 30, categoria: 'Rápido' },
    { produto: 'Produto B', giro: 8.2, dias: 45, categoria: 'Médio' },
    { produto: 'Produto C', giro: 4.1, dias: 90, categoria: 'Lento' },
    { produto: 'Produto D', giro: 15.8, dias: 23, categoria: 'Muito Rápido' },
    { produto: 'Produto E', giro: 2.3, dias: 160, categoria: 'Muito Lento' },
  ];

  const stockValueData = [
    { name: 'Produtos Ativos', value: 650000, percentage: 75, color: '#0ea5e9' },
    { name: 'Estoque Baixo', value: 120000, percentage: 14, color: '#f59e0b' },
    { name: 'Produtos Parados', value: 95000, percentage: 11, color: '#ef4444' },
  ];

  const inventoryMetrics = {
    totalProducts: 1247,
    totalValue: 865000,
    lowStockItems: 45,
    outOfStockItems: 12,
    averageTurnover: 8.7,
    stockAccuracy: 98.2
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico': return 'text-destructive';
      case 'baixo': return 'text-warning';
      case 'alto': return 'text-info';
      default: return 'text-success';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critico': return 'destructive';
      case 'baixo': return 'secondary';
      case 'alto': return 'outline';
      default: return 'default';
    }
  };

  const getTurnoverColor = (categoria: string) => {
    switch (categoria) {
      case 'Muito Rápido': return 'text-success';
      case 'Rápido': return 'text-success';
      case 'Médio': return 'text-warning';
      case 'Lento': return 'text-destructive';
      case 'Muito Lento': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
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
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{inventoryMetrics.totalProducts.toLocaleString()}</p>
                <p className="text-xs text-success">+2.3% vs mês anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor do Estoque</p>
                <p className="text-2xl font-bold">{formatCurrency(inventoryMetrics.totalValue)}</p>
                <p className="text-xs text-warning">-1.2% vs mês anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-success flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold">{inventoryMetrics.lowStockItems}</p>
                <p className="text-xs text-destructive">+5 desde ontem</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-warning flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Giro Médio</p>
                <p className="text-2xl font-bold">{inventoryMetrics.averageTurnover}x</p>
                <p className="text-xs text-success">+0.3x vs mês anterior</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-danger flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análises detalhadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="levels">Níveis</TabsTrigger>
          <TabsTrigger value="movement">Movimentação</TabsTrigger>
          <TabsTrigger value="turnover">Giro</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição do Valor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={stockValueData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                      >
                        {stockValueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4">
                  {stockValueData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(item.value)} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Análise Preditiva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Previsão de Ruptura</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Produto A</span>
                      <Badge variant="destructive">3 dias</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Produto B</span>
                      <Badge variant="secondary">7 dias</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Produto C</span>
                      <Badge variant="outline">15 dias</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Recomendações</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Reabastecer Categoria "Livros" urgentemente</li>
                    <li>• Reduzir estoque em "Casa" (excesso)</li>
                    <li>• Revisar ponto de pedido em "Roupas"</li>
                  </ul>
                </div>

                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <h4 className="font-semibold mb-1 text-success">Acurácia do Estoque</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={inventoryMetrics.stockAccuracy} className="flex-1" />
                    <span className="text-sm font-bold">{inventoryMetrics.stockAccuracy}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Níveis de Estoque por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stockLevelsData.map((item, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{item.categoria}</h4>
                        <Badge variant={getStatusBadge(item.status)}>
                          {item.status === 'critico' ? 'Crítico' : 
                           item.status === 'baixo' ? 'Baixo' :
                           item.status === 'alto' ? 'Alto' : 'Normal'}
                        </Badge>
                      </div>
                      <span className={`font-semibold ${getStatusColor(item.status)}`}>
                        {item.estoque}%
                      </span>
                    </div>

                    <div className="relative">
                      <Progress value={item.estoque} className="h-3" />
                      
                      {/* Marcadores de mínimo e máximo */}
                      <div 
                        className="absolute top-0 w-0.5 h-3 bg-destructive"
                        style={{ left: `${item.minimo}%` }}
                      />
                      <div 
                        className="absolute top-0 w-0.5 h-3 bg-warning"
                        style={{ left: `${item.maximo}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mín: {item.minimo}%</span>
                      <span>Atual: {item.estoque}%</span>
                      <span>Máx: {item.maximo}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Movimentação de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="entrada" fill="hsl(var(--success))" name="Entradas" />
                    <Bar dataKey="saida" fill="hsl(var(--destructive))" name="Saídas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Entradas Totais</p>
                  <p className="text-lg font-bold text-success">3.080</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saídas Totais</p>
                  <p className="text-lg font-bold text-destructive">2.870</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className="text-lg font-bold text-primary">+210</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Giro de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turnoverData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.produto}</h4>
                        <p className="text-sm text-muted-foreground">{item.dias} dias médios</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{item.giro}x</span>
                        <Badge variant="outline" className={getTurnoverColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
                <h4 className="font-semibold mb-2">Insights de Giro</h4>
                <ul className="text-sm space-y-1">
                  <li>• Produtos "Muito Rápidos" podem ter estoque reduzido</li>
                  <li>• Produtos "Lentos" precisam de estratégia de venda</li>
                  <li>• Giro médio geral: {inventoryMetrics.averageTurnover}x por mês</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}