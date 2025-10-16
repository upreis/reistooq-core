import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DetalhesTecnicosTabProps {
  devolucao: DevolucaoAvancada;
}

export const DetalhesTecnicosTab: React.FC<DetalhesTecnicosTabProps> = ({ devolucao }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Order ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono text-blue-600">{devolucao.order_id}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Claim ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono text-purple-600">{devolucao.claim_id || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">SKU</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono">{devolucao.sku || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{devolucao.quantidade || 1}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Conta ML</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.account_name || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.comprador_nickname || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">CPF/CNPJ Comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-mono">{devolucao.comprador_cpf || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Nome Completo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.comprador_nome_completo || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Transaction ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-mono">{devolucao.transaction_id || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{devolucao.anexos_count || 0} arquivo(s)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Necessita Ação Manual</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={devolucao.necessita_acao_manual ? 'destructive' : 'secondary'}>
            {devolucao.necessita_acao_manual ? 'Sim' : 'Não'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Tags Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{devolucao.tags_pedido || '-'}</p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">{devolucao.produto_titulo || '-'}</p>
        </CardContent>
      </Card>
    </div>
  );
};
