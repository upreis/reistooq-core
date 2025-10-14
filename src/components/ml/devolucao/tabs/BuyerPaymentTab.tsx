import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, CreditCard, Hash, Tag } from 'lucide-react';
import { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface BuyerPaymentTabProps {
  devolucao: any; // Usando any temporariamente até tipos serem atualizados
}

export const BuyerPaymentTab: React.FC<BuyerPaymentTabProps> = ({ devolucao }) => {
  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* DADOS DO COMPRADOR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Comprador
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>CPF/CNPJ</Label>
            <p className="font-mono text-sm">{devolucao.comprador_cpf || '-'}</p>
          </div>
          <div>
            <Label>Nome Completo</Label>
            <p className="font-medium">{devolucao.comprador_nome_completo || '-'}</p>
          </div>
          <div>
            <Label>Nickname</Label>
            <p className="text-blue-600 dark:text-blue-400 font-medium">
              {devolucao.comprador_nickname || '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* INFORMAÇÕES DE PAGAMENTO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Método de Pagamento</Label>
            <Badge variant="outline" className="mt-1">
              {devolucao.metodo_pagamento || '-'}
            </Badge>
          </div>
          <div>
            <Label>Tipo de Pagamento</Label>
            <Badge variant="secondary" className="mt-1">
              {devolucao.tipo_pagamento || '-'}
            </Badge>
          </div>
          <div>
            <Label>Parcelas</Label>
            <p className="font-medium">
              {devolucao.parcelas ? `${devolucao.parcelas}x` : '-'}
            </p>
          </div>
          <div>
            <Label>Valor da Parcela</Label>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(devolucao.valor_parcela)}
            </p>
          </div>
          <div>
            <Label>Transaction ID</Label>
            <p className="font-mono text-xs truncate" title={devolucao.transaction_id || '-'}>
              {devolucao.transaction_id || '-'}
            </p>
          </div>
          <div>
            <Label>% Reembolsado</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(devolucao.percentual_reembolsado || 0, 100)}%` }}
                />
              </div>
              <span className="font-semibold text-sm">
                {devolucao.percentual_reembolsado?.toFixed(0) || 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TAGS DO PEDIDO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {devolucao.tags_pedido && Array.isArray(devolucao.tags_pedido) && devolucao.tags_pedido.length > 0 ? (
              devolucao.tags_pedido.map((tag: string, index: number) => (
                <Badge key={`buyer-tag-${tag}-${index}`} variant="outline">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tag registrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
