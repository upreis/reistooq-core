/**
 * 📊 CÉLULAS DE METADADOS E QUALIDADE
 * 3 campos de metadados que estavam sendo mapeados mas não exibidos
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, Paperclip, FileText } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface MetadataDetailedCellsProps {
  devolucao: DevolucaoAvancada;
}

export function MetadataDetailedCells({ devolucao }: MetadataDetailedCellsProps) {
  return (
    <>
      {/* Usuário Última Ação */}
      <td className="px-3 py-3 text-left">
        {devolucao.usuario_ultima_acao ? (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{devolucao.usuario_ultima_acao}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Total Evidências */}
      <td className="px-3 py-3 text-center">
        {devolucao.total_evidencias !== null && devolucao.total_evidencias !== undefined ? (
          <Badge variant="secondary">
            <FileText className="h-3 w-3 mr-1" />
            {devolucao.total_evidencias}
          </Badge>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>

      {/* Anexos ML */}
      <td className="px-3 py-3 text-center">
        {devolucao.anexos_ml && Array.isArray(devolucao.anexos_ml) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-pointer">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {devolucao.anexos_ml.length} anexos
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {devolucao.anexos_ml.slice(0, 10).map((anexo: any, idx: number) => (
                    <div key={idx} className="text-xs">
                      {anexo.nome || anexo.filename || `Anexo ${idx + 1}`}
                    </div>
                  ))}
                  {devolucao.anexos_ml.length > 10 && (
                    <div className="text-xs text-muted-foreground">
                      +{devolucao.anexos_ml.length - 10} anexos...
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
    </>
  );
}
