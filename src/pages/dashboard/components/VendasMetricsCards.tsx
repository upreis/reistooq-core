import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, DollarSign, TrendingUp, Users, 
  Package, Target, Calendar, MapPin 
} from 'lucide-react';

interface VendasMetricsCardsProps {
  metrics: any;
  analytics: any;
  isLoading: boolean;
}

export function VendasMetricsCards({ metrics, analytics, isLoading }: VendasMetricsCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const formatPercent = (value: number) => 
    `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  
  const getGrowthColor = (growth: number) => 
    growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-muted-foreground';
  
  const cards = [
    {
      title: "Vendas Hoje",
      value: formatCurrency(metrics.vendasHoje.valor),
      subtitle: `${metrics.vendasHoje.quantidade} pedidos`,
      icon: DollarSign,
      growth: metrics.vendasHoje.crescimento,
      color: "text-blue-600"
    },
    {
      title: "Total de Pedidos",
      value: metrics.totalVendas.toLocaleString(),
      subtitle: "Pedidos processados",
      icon: ShoppingCart,
      growth: null,
      color: "text-green-600"
    },
    {
      title: "Valor Total",
      value: formatCurrency(metrics.valorTotal),
      subtitle: "Faturamento total",
      icon: Target,
      growth: null,
      color: "text-purple-600"
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(metrics.ticketMedio),
      subtitle: "Por pedido",
      icon: TrendingUp,
      growth: null,
      color: "text-orange-600"
    },
    {
      title: "Clientes Únicos",
      value: metrics.clientesUnicos.toLocaleString(),
      subtitle: "Clientes diferentes",
      icon: Users,
      growth: null,
      color: "text-indigo-600"
    },
    {
      title: "Produtos Únicos",
      value: metrics.produtosUnicos.toLocaleString(),
      subtitle: "SKUs diferentes",
      icon: Package,
      growth: null,
      color: "text-pink-600"
    },
    {
      title: "Estados Atendidos",
      value: analytics?.geografico?.estados?.length || 0,
      subtitle: "Estados com vendas",
      icon: MapPin,
      growth: null,
      color: "text-cyan-600"
    },
    {
      title: "Período Ativo",
      value: analytics?.temporal?.diario?.length || 0,
      subtitle: "Dias com vendas",
      icon: Calendar,
      growth: null,
      color: "text-amber-600"
    }
  ];
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              {card.growth !== null && (
                <Badge 
                  variant="outline" 
                  className={getGrowthColor(card.growth)}
                >
                  {formatPercent(card.growth)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
