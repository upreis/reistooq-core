import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Users, Package } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: number;
  color: string;
}

function KPICard({ title, value, subtitle, icon: Icon, trend, color }: KPICardProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  
  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium ${
              trendPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {trendPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardKPICardsProps {
  vendasHoje: number;
  crescimentoHoje: number;
  pedidosMes: number;
  crescimentoMes: number;
  receitaTotal: number;
  crescimentoReceita: number;
  novosClientes: number;
  crescimentoClientes: number;
}

export function DashboardKPICards({
  vendasHoje,
  crescimentoHoje,
  pedidosMes,
  crescimentoMes,
  receitaTotal,
  crescimentoReceita,
  novosClientes,
  crescimentoClientes,
}: DashboardKPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Vendas Hoje"
        value={vendasHoje}
        subtitle="pedidos realizados"
        icon={ShoppingCart}
        trend={crescimentoHoje}
        color="bg-blue-500/10 text-blue-500"
      />
      <KPICard
        title="Pedidos do Mês"
        value={pedidosMes}
        subtitle="total no período"
        icon={Package}
        trend={crescimentoMes}
        color="bg-purple-500/10 text-purple-500"
      />
      <KPICard
        title="Receita Total"
        value={`R$ ${(receitaTotal / 1000).toFixed(1)}k`}
        subtitle="faturamento acumulado"
        icon={DollarSign}
        trend={crescimentoReceita}
        color="bg-green-500/10 text-green-500"
      />
      <KPICard
        title="Novos Clientes"
        value={novosClientes}
        subtitle="este mês"
        icon={Users}
        trend={crescimentoClientes}
        color="bg-orange-500/10 text-orange-500"
      />
    </div>
  );
}
