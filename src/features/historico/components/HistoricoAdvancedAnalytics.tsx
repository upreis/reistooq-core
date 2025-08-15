import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, MapPin, 
  Calendar, Users, Package, DollarSign, Target, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie,
  AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { HistoricoVenda, HistoricoSummary } from '../types/historicoTypes';

interface HistoricoAdvancedAnalyticsProps {
  vendas: HistoricoVenda[];
  summary?: HistoricoSummary;
  dateRange?: { start?: string; end?: string };
}

interface TrendData {
  period: string;
  vendas: number;
  valor: number;
  ticket_medio: number;
}

interface ProductAnalysis {
  sku: string;
  nome: string;
  quantidade_vendida: number;
  valor_total: number;
  margem_estimada?: number;
  categoria?: string;
  performance_score: number;
}

interface GeographicData {
  uf: string;
  cidade?: string;
  vendas: number;
  valor: number;
  clientes_unicos: number;
}

interface CustomerSegment {
  segment: string;
  count: number;
  valor_total: number;
  ticket_medio: number;
  frequencia_media: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const HistoricoAdvancedAnalytics: React.FC<HistoricoAdvancedAnalyticsProps> = ({
  vendas,
  summary,
  dateRange
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedMetric, setSelectedMetric] = useState('valor');

  // Temporal trend analysis
  const trendData = useMemo((): TrendData[] => {
    const grouped = vendas.reduce((acc, venda) => {
      let period: string;
      const date = new Date(venda.data_pedido);
      
      switch (selectedPeriod) {
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'daily':
        default:
          period = venda.data_pedido;
          break;
      }

      if (!acc[period]) {
        acc[period] = { vendas: 0, valor: 0, count: 0 };
      }
      
      acc[period].vendas++;
      acc[period].valor += venda.valor_total;
      acc[period].count++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        vendas: data.vendas,
        valor: data.valor,
        ticket_medio: data.valor / data.vendas
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [vendas, selectedPeriod]);

  // Product performance analysis with ABC classification
  const productAnalysis = useMemo((): ProductAnalysis[] => {
    const grouped = vendas.reduce((acc, venda) => {
      const key = venda.sku_produto;
      if (!acc[key]) {
        acc[key] = {
          sku: venda.sku_produto,
          nome: venda.descricao || venda.sku_produto,
          quantidade_vendida: 0,
          valor_total: 0
        };
      }
      
      acc[key].quantidade_vendida += venda.quantidade;
      acc[key].valor_total += venda.valor_total;
      
      return acc;
    }, {} as Record<string, any>);

    const products = Object.values(grouped) as ProductAnalysis[];
    
    // Calculate performance score and ABC classification
    const maxValor = Math.max(...products.map(p => p.valor_total));
    const maxQuantidade = Math.max(...products.map(p => p.quantidade_vendida));
    
    return products
      .map(product => ({
        ...product,
        performance_score: (
          (product.valor_total / maxValor) * 0.7 + 
          (product.quantidade_vendida / maxQuantidade) * 0.3
        ) * 100
      }))
      .sort((a, b) => b.performance_score - a.performance_score);
  }, [vendas]);

  // Geographic analysis
  const geographicData = useMemo((): GeographicData[] => {
    const grouped = vendas.reduce((acc, venda) => {
      const uf = venda.uf || 'N/I';
      const cidade = venda.cidade || 'N/I';
      const key = `${uf}-${cidade}`;
      
      if (!acc[key]) {
        acc[key] = {
          uf,
          cidade,
          vendas: 0,
          valor: 0,
          clientes: new Set()
        };
      }
      
      acc[key].vendas++;
      acc[key].valor += venda.valor_total;
      acc[key].clientes.add(venda.cliente_nome);
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped)
      .map((data: any) => ({
        ...data,
        clientes_unicos: data.clientes.size
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [vendas]);

  // Customer segmentation (RFM analysis simplified)
  const customerSegments = useMemo((): CustomerSegment[] => {
    const customers = vendas.reduce((acc, venda) => {
      const cliente = venda.cliente_nome;
      if (!acc[cliente]) {
        acc[cliente] = {
          vendas: [],
          valor_total: 0
        };
      }
      
      acc[cliente].vendas.push(venda);
      acc[cliente].valor_total += venda.valor_total;
      
      return acc;
    }, {} as Record<string, any>);

    // Simplified segmentation based on purchase value and frequency
    const segments = {
      vip: { count: 0, valor_total: 0, ticket_medio: 0, frequencia_media: 0 },
      regular: { count: 0, valor_total: 0, ticket_medio: 0, frequencia_media: 0 },
      ocasional: { count: 0, valor_total: 0, ticket_medio: 0, frequencia_media: 0 },
      novo: { count: 0, valor_total: 0, ticket_medio: 0, frequencia_media: 0 }
    };

    Object.values(customers).forEach((customer: any) => {
      const frequencia = customer.vendas.length;
      const valorMedio = customer.valor_total / frequencia;
      
      let segment: keyof typeof segments;
      if (valorMedio > 500 && frequencia > 5) {
        segment = 'vip';
      } else if (valorMedio > 200 && frequencia > 2) {
        segment = 'regular';
      } else if (frequencia > 1) {
        segment = 'ocasional';
      } else {
        segment = 'novo';
      }
      
      segments[segment].count++;
      segments[segment].valor_total += customer.valor_total;
      segments[segment].frequencia_media += frequencia;
    });

    return Object.entries(segments).map(([segment, data]) => ({
      segment: segment.charAt(0).toUpperCase() + segment.slice(1),
      count: data.count,
      valor_total: data.valor_total,
      ticket_medio: data.count > 0 ? data.valor_total / data.count : 0,
      frequencia_media: data.count > 0 ? data.frequencia_media / data.count : 0
    }));
  }, [vendas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getABCClass = (index: number, total: number) => {
    const percentile = (index / total) * 100;
    if (percentile <= 20) return { class: 'A', color: 'bg-green-500' };
    if (percentile <= 50) return { class: 'B', color: 'bg-yellow-500' };
    return { class: 'C', color: 'bg-red-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Avançado</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="geography">Geografia</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valor">Valor</SelectItem>
                <SelectItem value="vendas">Quantidade</SelectItem>
                <SelectItem value="ticket_medio">Ticket Médio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Temporal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => 
                      selectedMetric === 'valor' || selectedMetric === 'ticket_medio' 
                        ? formatCurrency(value) 
                        : value.toLocaleString()
                    }
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Top 10 Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productAnalysis.slice(0, 10).map((product, index) => {
                    const abc = getABCClass(index, productAnalysis.length);
                    return (
                      <div key={product.sku} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge className={`${abc.color} text-white`}>
                            {abc.class}
                          </Badge>
                          <div>
                            <div className="font-medium">{product.nome}</div>
                            <div className="text-sm text-muted-foreground">{product.sku}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(product.valor_total)}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.quantidade_vendida} unidades
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={productAnalysis.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quantidade_vendida" name="Quantidade" />
                    <YAxis dataKey="valor_total" name="Valor Total" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'Valor Total' ? formatCurrency(value) : value,
                        name
                      ]}
                      labelFormatter={(label: string) => `SKU: ${label}`}
                    />
                    <Scatter dataKey="valor_total" fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Vendas por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geographicData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="uf" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="valor" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição Regional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {geographicData.slice(0, 8).map((region, index) => (
                    <div key={`${region.uf}-${region.cidade}`} 
                         className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{region.cidade}, {region.uf}</div>
                        <div className="text-sm text-muted-foreground">
                          {region.clientes_unicos} clientes únicos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(region.valor)}</div>
                        <div className="text-sm text-muted-foreground">
                          {region.vendas} vendas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentação de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={customerSegments}
                      dataKey="count"
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ segment, count }) => `${segment}: ${count}`}
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valor por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSegments.map((segment, index) => (
                    <div key={segment.segment} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          {segment.segment}
                        </span>
                        <span className="font-medium">{formatCurrency(segment.valor_total)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div>{segment.count} clientes</div>
                        <div>Ticket: {formatCurrency(segment.ticket_medio)}</div>
                        <div>Freq: {segment.frequencia_media.toFixed(1)}x</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};