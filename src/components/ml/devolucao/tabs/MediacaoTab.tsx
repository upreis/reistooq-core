import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MediacaoTabProps {
  devolucao: DevolucaoAvancada;
}

export const MediacaoTab: React.FC<MediacaoTabProps> = ({ devolucao }) => {
  const orderData = devolucao.dados_order || {};
  const mediations = orderData.mediations || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Status Mediação</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={devolucao.em_mediacao ? 'default' : 'secondary'} className="text-base">
            {devolucao.em_mediacao ? 'Em Mediação' : 'Sem Mediação'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Resultado Mediação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.resultado_mediacao || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Mediador ML</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.mediador_ml || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Feedback Comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">{devolucao.feedback_comprador_final || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Feedback Vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">{devolucao.feedback_vendedor || '-'}</p>
        </CardContent>
      </Card>

      {mediations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mediações ({mediations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mediations.map((mediation: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="text-sm font-medium">Mediação #{index + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {JSON.stringify(mediation, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
