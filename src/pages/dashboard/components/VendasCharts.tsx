import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

interface VendasChartsProps {
  analytics: any;
  vendas: any[];
  filters: any;
}

export function VendasCharts({ analytics, vendas, filters }: VendasChartsProps) {
  const [activeChart, setActiveChart] = useState('temporal');
  
  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  const temporalData = analytics.temporal?.diario?.slice(-30) || [];
  const produtosData = analytics.produtos?.topVendidos?.slice(0, 10) || [];
  const estadosData = analytics.geografico?.estados?.slice(0, 10) || [];
  
  const empresasData = vendas.reduce((acc, venda) => {
    const empresa = venda.empresa || 'Não informado';
    if (!acc[empresa]) {
      acc[empresa] = { empresa, vendas: 0, valor: 0 };
    }
    acc[empresa].vendas++;
    acc[empresa].valor += venda.valor_total || 0;
    return acc;
  }, {} as Record<string, any>);
  const empresasArray = Object.values(empresasData);
  
  const charts = [
    {
      id: 'temporal',
      title: 'Vendas por Período',
      icon: LineChartIcon,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={temporalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="data" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
              formatter={(value: any, name: string) => [
                name === 'valor' ? formatCurrency(value) : value,
                name === 'valor' ? 'Faturamento' : 'Vendas'
              ]}
            />
            <Legend />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="valor"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Bar yAxisId="left" dataKey="vendas" fill="#82ca9d" />
          </AreaChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'produtos',
      title: 'Top Produtos',
      icon: BarChart3,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={produtosData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              dataKey="sku" 
              type="category" 
              width={100}
              tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
            />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'valor' ? formatCurrency(value) : value,
                name === 'valor' ? 'Faturamento' : 'Quantidade'
              ]}
            />
            <Legend />
            <Bar dataKey="quantidade" fill="#8884d8" />
            <Bar dataKey="valor" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'geografico',
      title: 'Vendas por Estado',
      icon: PieChartIcon,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={estadosData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ uf, percent }: any) => `${uf} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="vendas"
            >
              {estadosData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    },
    {
      id: 'empresas',
      title: 'Vendas por Canal',
      icon: BarChart3,
      component: (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={empresasArray}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="empresa" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'valor' ? formatCurrency(value) : value,
                name === 'valor' ? 'Faturamento' : 'Vendas'
              ]}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="vendas" fill="#8884d8" />
            <Bar yAxisId="right" dataKey="valor" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  ];
  
  const activeChartData = charts.find(chart => chart.id === activeChart);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Análises Gráficas</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {charts.map(chart => (
                <Button
                  key={chart.id}
                  variant={activeChart === chart.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChart(chart.id)}
                  className="gap-2"
                >
                  <chart.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{chart.title}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeChartData?.component}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                vendas.reduce((acc, venda) => {
                  const status = venda.status || 'Não informado';
                  if (!acc[status]) acc[status] = 0;
                  acc[status]++;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count], index) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{status}</span>
                  </div>
                  <Badge variant="outline">{String(count)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.geografico?.cidades?.slice(0, 8).map((cidade: any, index: number) => (
                <div key={cidade.cidade} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{cidade.cidade} - {cidade.uf}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{cidade.vendas}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(cidade.valor)}
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
