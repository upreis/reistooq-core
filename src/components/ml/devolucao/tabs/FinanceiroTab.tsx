import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinanceiroTabProps {
  devolucao: DevolucaoAvancada;
}

export const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ devolucao }) => {
  const formatCurrency = (value: any) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Retido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(devolucao.valor_retido)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Reembolso Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-red-600">{formatCurrency(devolucao.valor_reembolso_total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Reembolso Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.valor_reembolso_produto)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Reembolso Frete</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.valor_reembolso_frete)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Taxa ML Reembolso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.taxa_ml_reembolso)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Custo Logístico Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.custo_logistico_total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Custo Envio Devolução</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.custo_envio_devolucao)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Compensação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.valor_compensacao)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Método Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.metodo_pagamento || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{devolucao.parcelas ? `${devolucao.parcelas}x` : '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor Parcela</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatCurrency(devolucao.valor_parcela)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Percentual Reembolsado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {devolucao.percentual_reembolsado ? `${devolucao.percentual_reembolsado}%` : '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
