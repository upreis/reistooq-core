import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RastreamentoTabProps {
  devolucao: DevolucaoAvancada;
}

export const RastreamentoTab: React.FC<RastreamentoTabProps> = ({ devolucao }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Shipment ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono">{devolucao.shipment_id || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Tracking Number</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono">{devolucao.codigo_rastreamento || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Transportadora</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.transportadora || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Status Envio</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-base">
            {devolucao.status_rastreamento_pedido || '-'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
