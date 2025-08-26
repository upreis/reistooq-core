// Estatísticas simples para histórico
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, DollarSign, Calculator } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricoSimpleStatsProps {
  stats?: {
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
  };
  isLoading?: boolean;
}

export function HistoricoSimpleStats({ stats, isLoading }: HistoricoSimpleStatsProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total de Vendas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalVendas?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            pedidos processados
          </p>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? formatCurrency(stats.valorTotal) : 'R$ 0,00'}
          </div>
          <p className="text-xs text-muted-foreground">
            em vendas realizadas
          </p>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats ? formatCurrency(stats.ticketMedio) : 'R$ 0,00'}
          </div>
          <p className="text-xs text-muted-foreground">
            por pedido
          </p>
        </CardContent>
      </Card>
    </div>
  );
}