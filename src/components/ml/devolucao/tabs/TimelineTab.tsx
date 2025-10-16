import React from 'react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimelineTabProps {
  devolucao: DevolucaoAvancada;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ devolucao }) => {
  const formatDateTime = (date: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(date);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Data Criação Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatDateTime(devolucao.data_criacao_claim)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Data Início Return</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatDateTime(devolucao.data_inicio_return)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Data Fechamento Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatDateTime(devolucao.data_fechamento_claim)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Data Primeira Ação</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatDateTime(devolucao.data_primeira_acao)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Resposta Comprador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {devolucao.tempo_resposta_comprador ? `${devolucao.tempo_resposta_comprador}h` : '-'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Análise ML</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {devolucao.tempo_analise_ml ? `${devolucao.tempo_analise_ml}h` : '-'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Prazo Limite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{formatDateTime(devolucao.tempo_limite_acao)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Dias Restantes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${
            (devolucao.dias_restantes_acao ?? 0) <= 3 ? 'text-red-600' :
            (devolucao.dias_restantes_acao ?? 0) <= 7 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {devolucao.dias_restantes_acao !== null ? `${devolucao.dias_restantes_acao} dias` : '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
