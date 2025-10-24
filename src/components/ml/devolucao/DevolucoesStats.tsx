import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Clock, TrendingUp } from "lucide-react";
import type { DevolucaoAvancada } from "@/features/devolucoes/types/devolucao-avancada.types";

interface DevolucoesStatsProps {
  devolucoes: DevolucaoAvancada[];
}

export function DevolucoesStats({ devolucoes }: DevolucoesStatsProps) {
  // Filtrar devoluções que têm return
  const comDevolucao = devolucoes.filter(d => d.has_related_return);
  const percentual = devolucoes.length > 0 
    ? (comDevolucao.length / devolucoes.length) * 100 
    : 0;
  
  // Status de reembolso
  const reembolsadas = comDevolucao.filter(d => d.status_dinheiro === 'refunded').length;
  const pendentes = comDevolucao.filter(d => d.status_dinheiro === 'pending').length;
  const naoReembolsadas = comDevolucao.filter(d => 
    d.status_dinheiro && !['refunded', 'pending'].includes(d.status_dinheiro)
  ).length;
  
  // Status de devolução
  const entregues = comDevolucao.filter(d => d.status_devolucao === 'delivered').length;
  const emTransito = comDevolucao.filter(d => 
    d.status_devolucao && ['in_transit', 'ready_to_ship', 'label_generated'].includes(d.status_devolucao)
  ).length;
  const canceladas = comDevolucao.filter(d => 
    d.status_devolucao && ['cancelled', 'expired'].includes(d.status_devolucao)
  ).length;
  
  // Valor total de reembolsos
  const valorTotalReembolsos = comDevolucao
    .filter(d => d.status_dinheiro === 'refunded')
    .reduce((sum, d) => sum + (d.valor_reembolso_total || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total com Devolução */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total com Devolução
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{comDevolucao.length}</div>
          <p className="text-xs text-muted-foreground">
            {percentual.toFixed(1)}% do total de {devolucoes.length} claims
          </p>
          <div className="mt-2 flex gap-2 flex-wrap">
            <div className="text-xs">
              <span className="text-green-600 font-medium">✓ {entregues}</span> entregues
            </div>
            <div className="text-xs">
              <span className="text-blue-600 font-medium">→ {emTransito}</span> em trânsito
            </div>
            <div className="text-xs">
              <span className="text-red-600 font-medium">✕ {canceladas}</span> canceladas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reembolsos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Status de Reembolso
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{reembolsadas}</div>
          <p className="text-xs text-muted-foreground">
            Reembolsadas ({comDevolucao.length > 0 ? ((reembolsadas / comDevolucao.length) * 100).toFixed(1) : 0}%)
          </p>
          <div className="mt-2 space-y-1">
            <div className="text-xs flex justify-between">
              <span className="text-yellow-600">Pendentes:</span>
              <span className="font-medium">{pendentes}</span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-muted-foreground">Não reembolsadas:</span>
              <span className="font-medium">{naoReembolsadas}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valor Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor Total Reembolsado
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(valorTotalReembolsos)}
          </div>
          <p className="text-xs text-muted-foreground">
            Em {reembolsadas} devoluções
          </p>
          {reembolsadas > 0 && (
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Média por devolução:</span>
              <span className="font-medium ml-1">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(valorTotalReembolsos / reembolsadas)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Taxa de Sucesso */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Sucesso
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {comDevolucao.length > 0 
              ? ((entregues / comDevolucao.length) * 100).toFixed(1) 
              : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Devoluções entregues
          </p>
          <div className="mt-2 space-y-1">
            <div className="text-xs flex justify-between">
              <span className="text-muted-foreground">Em andamento:</span>
              <span className="font-medium">{emTransito}</span>
            </div>
            <div className="text-xs flex justify-between">
              <span className="text-red-600">Falhas:</span>
              <span className="font-medium">{canceladas}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
