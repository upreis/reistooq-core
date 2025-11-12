/**
 * 💬 CÉLULAS DE COMUNICAÇÃO PRIORITÁRIAS
 * Qualidade Comunicação | N° Interações
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface CommunicationPriorityCellsProps {
  devolucao: DevolucaoAvancada;
}

const getQualityBadge = (quality: string | null | undefined) => {
  if (!quality) return null;

  const normalizedQuality = quality.toLowerCase();

  if (normalizedQuality.includes('clean') || normalizedQuality.includes('boa')) {
    return (
      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        Boa
      </Badge>
    );
  }

  if (normalizedQuality.includes('moderate') || normalizedQuality.includes('média')) {
    return (
      <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
        <AlertCircle className="h-3 w-3" />
        Média
      </Badge>
    );
  }

  if (normalizedQuality.includes('poor') || normalizedQuality.includes('ruim')) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Ruim
      </Badge>
    );
  }

  return <span className="text-xs text-muted-foreground">{quality}</span>;
};

export function CommunicationPriorityCells({ devolucao }: CommunicationPriorityCellsProps) {
  return (
    <>
      {/* Qualidade Comunicação */}
      <td className="px-3 py-3 text-center">
        {devolucao.qualidade_comunicacao ? (
          getQualityBadge(devolucao.qualidade_comunicacao)
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>

      {/* N° Interações */}
      <td className="px-3 py-3 text-center">
        {devolucao.numero_interacoes !== null && devolucao.numero_interacoes !== undefined ? (
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {devolucao.numero_interacoes}
            </span>
            {devolucao.numero_interacoes === 0 && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Sem resposta
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>
    </>
  );
}
