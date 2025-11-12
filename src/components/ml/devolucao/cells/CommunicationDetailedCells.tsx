/**
 * 💬 CÉLULAS DE COMUNICAÇÃO E TIMELINE DETALHADAS
 * 8 campos de comunicação/timeline que estavam sendo mapeados mas não exibidos
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Calendar, History, MessageSquare } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface CommunicationDetailedCellsProps {
  devolucao: DevolucaoAvancada;
}

const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    return new Date(date).toLocaleDateString('pt-BR', {
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

export function CommunicationDetailedCells({ devolucao }: CommunicationDetailedCellsProps) {
  return (
    <>
      {/* Timeline Events */}
      <td className="px-3 py-3 text-center">
        {devolucao.timeline_events && Array.isArray(devolucao.timeline_events) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-pointer">
                  <History className="h-3 w-3 mr-1" />
                  {devolucao.timeline_events.length} eventos
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {devolucao.timeline_events.slice(0, 5).map((event: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <strong>{formatDateTime(event.date || event.timestamp)}</strong>: {event.type || event.event_type}
                    </div>
                  ))}
                  {devolucao.timeline_events.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{devolucao.timeline_events.length - 5} eventos...
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Marcos Temporais */}
      <td className="px-3 py-3 text-center">
        {devolucao.marcos_temporais ? (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Disponível
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Data Criação Claim */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(devolucao.data_criacao_claim)}</span>
        </div>
      </td>

      {/* Data Início Return */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(devolucao.data_inicio_return)}</span>
        </div>
      </td>

      {/* Data Fechamento Claim */}
      <td className="px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{formatDateTime(devolucao.data_fechamento_claim)}</span>
        </div>
      </td>

      {/* Histórico Status */}
      <td className="px-3 py-3 text-center">
        {devolucao.historico_status && Array.isArray(devolucao.historico_status) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-pointer">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {devolucao.historico_status.length} mudanças
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {devolucao.historico_status.slice(0, 5).map((status: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      <strong>{formatDateTime(status.timestamp)}</strong>: {status.status_anterior} → {status.status_novo}
                    </div>
                  ))}
                  {devolucao.historico_status.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{devolucao.historico_status.length - 5} mudanças...
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </>
  );
}
