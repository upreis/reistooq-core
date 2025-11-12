/**
 * 🤝 CÉLULAS DE MEDIAÇÃO E CONTEXTO DETALHADAS
 * 7 campos de mediação que estavam sendo mapeados mas não exibidos
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Package, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface MediationDetailedCellsProps {
  devolucao: DevolucaoAvancada;
}

export function MediationDetailedCells({ devolucao }: MediationDetailedCellsProps) {
  return (
    <>
      {/* Resultado Mediação */}
      <td className="px-3 py-3 text-left">
        {devolucao.resultado_mediacao ? (
          <Badge 
            variant={
              devolucao.resultado_mediacao.includes('favor_comprador') ? 'destructive' :
              devolucao.resultado_mediacao.includes('favor_vendedor') ? 'default' :
              'outline'
            }
          >
            <Users className="h-3 w-3 mr-1" />
            {devolucao.resultado_mediacao}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Detalhes Mediação */}
      <td className="px-3 py-3 text-center">
        {devolucao.detalhes_mediacao ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-pointer">
                  Detalhes
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="text-xs">
                  {typeof devolucao.detalhes_mediacao === 'string' 
                    ? devolucao.detalhes_mediacao 
                    : JSON.stringify(devolucao.detalhes_mediacao, null, 2)}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Produto Troca ID */}
      <td className="px-3 py-3 text-center">
        {devolucao.produto_troca_id ? (
          <div className="flex items-center justify-center gap-1">
            <Package className="h-3 w-3 text-blue-600" />
            <span className="text-sm font-mono">{devolucao.produto_troca_id}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Novo Pedido ID */}
      <td className="px-3 py-3 text-center">
        {devolucao.novo_pedido_id ? (
          <span className="text-sm font-mono text-blue-600">
            {devolucao.novo_pedido_id}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Dias Restantes Ação */}
      <td className="px-3 py-3 text-center">
        {devolucao.dias_restantes_acao !== null && devolucao.dias_restantes_acao !== undefined ? (
          <Badge 
            variant={
              devolucao.dias_restantes_acao <= 1 ? 'destructive' :
              devolucao.dias_restantes_acao <= 3 ? 'outline' :
              'secondary'
            }
          >
            <Clock className="h-3 w-3 mr-1" />
            {devolucao.dias_restantes_acao} dias
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Prazo Revisão Dias */}
      <td className="px-3 py-3 text-center">
        {devolucao.prazo_revisao_dias !== null && devolucao.prazo_revisao_dias !== undefined ? (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            {devolucao.prazo_revisao_dias} dias
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </>
  );
}
