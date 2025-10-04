import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { formatMoney } from "@/lib/format";

interface ComprasStatsProps {
  fornecedores: any[];
  pedidosCompra: any[];
  cotacoes: any[];
}

export const ComprasStats: React.FC<ComprasStatsProps> = ({
  fornecedores = [],
  pedidosCompra = [],
  cotacoes = []
}) => {
  const totalFornecedores = fornecedores.length;
  const fornecedoresAtivos = fornecedores.filter(f => f.ativo).length;
  
  const totalPedidos = pedidosCompra.length;
  const pedidosPendentes = pedidosCompra.filter(p => p.status === 'pendente').length;
  
  const totalCotacoes = cotacoes.length;
  const cotacoesAbertas = cotacoes.filter(c => c.status === 'aberta').length;
  
  const valorTotalPedidos = pedidosCompra.reduce((acc, p) => acc + (p.valor_total || 0), 0);

  // Usando formatMoney de src/lib/format.ts para consistência

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Fornecedores */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Fornecedores
          </CardTitle>
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {totalFornecedores}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              {fornecedoresAtivos} ativos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Pedidos de Compra */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Pedidos de Compra
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {totalPedidos}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
              {pedidosPendentes} pendentes
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cotações */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Cotações
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {totalCotacoes}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              {cotacoesAbertas} abertas
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Valor Total Pedidos
          </CardTitle>
          <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {formatMoney(valorTotalPedidos)}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-orange-600 dark:text-orange-400">
              {totalPedidos > 0 ? `Média: ${formatMoney(valorTotalPedidos / totalPedidos)}` : 'Sem pedidos'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};