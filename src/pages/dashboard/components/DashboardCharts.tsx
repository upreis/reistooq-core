import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardChartsProps {
  vendasDiarias: Array<{ data: string; vendas: number; valor: number }>;
  topProdutos: Array<{ sku: string; nome: string; quantidade: number; valor: number }>;
  vendasPorCanal: Array<{ canal: string; vendas: number; valor: number }>;
  metaMensal: number;
  progressoMeta: number;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export function DashboardCharts({
  vendasDiarias,
  topProdutos,
  vendasPorCanal,
  metaMensal,
  progressoMeta,
}: DashboardChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Valor') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Line Chart - Vendas 30 dias */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Evolução de Vendas - Últimos 30 Dias</span>
            <span className="text-sm font-normal text-muted-foreground">
              Total: {vendasDiarias.reduce((acc, d) => acc + d.vendas, 0)} pedidos
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendasDiarias}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="data" 
                className="text-xs"
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), 'dd/MM', { locale: ptBR });
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                name="Vendas"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="valor" 
                name="Valor (R$)"
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gauge Chart - Meta Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Meta Mensal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="20"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="20"
                strokeDasharray={`${(progressoMeta / 100) * 502.65} 502.65`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                className="transition-all duration-1000"
              />
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dy="0.3em"
                className="text-4xl font-bold fill-current"
              >
                {progressoMeta.toFixed(0)}%
              </text>
            </svg>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Meta: {formatCurrency(metaMensal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Donut Chart - Canais */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={vendasPorCanal}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="vendas"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {vendasPorCanal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart - Top Produtos */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProdutos.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="nome" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis className="text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="quantidade" name="Quantidade" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
