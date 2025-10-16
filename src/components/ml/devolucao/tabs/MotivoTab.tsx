import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MotivoTabProps {
  devolucao: DevolucaoAvancada;
}

export const MotivoTab: React.FC<MotivoTabProps> = ({ devolucao }) => {
  const claimData = devolucao.dados_claim || {};

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Reason ID</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold font-mono">{claimData.reason_id || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-base">
            {devolucao.reason_category || '-'}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Categoria Problema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.categoria_problema || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Subcategoria Problema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{devolucao.subcategoria_problema || '-'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Nível Complexidade</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant={
              devolucao.nivel_complexidade === 'high' ? 'destructive' :
              devolucao.nivel_complexidade === 'medium' ? 'default' :
              'secondary'
            }
            className="text-base"
          >
            {devolucao.nivel_complexidade || '-'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
