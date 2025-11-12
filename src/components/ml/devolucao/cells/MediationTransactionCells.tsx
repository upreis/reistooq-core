/**
 * 🤝 CÉLULAS DE MEDIAÇÃO E TRANSAÇÃO
 * Mediador ML | Transaction ID
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, CreditCard } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface MediationTransactionCellsProps {
  devolucao: DevolucaoAvancada;
}

export function MediationTransactionCells({ devolucao }: MediationTransactionCellsProps) {
  // 🐛 DEBUG: Ver campos de mediação
  console.log('🔍 MediationTransactionCells - mediador_ml:', devolucao.mediador_ml);
  console.log('🔍 MediationTransactionCells - transaction_id:', devolucao.transaction_id);
  
  return (
    <>
      {/* Mediador ML */}
      <td className="px-3 py-3 text-center">
        {devolucao.mediador_ml ? (
          <div className="flex items-center justify-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-mono">{devolucao.mediador_ml}</span>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              Mediação
            </Badge>
          </div>
        ) : devolucao.em_mediacao ? (
          <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
            <Users className="h-3 w-3" />
            Em Mediação
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>

      {/* Transaction ID */}
      <td className="px-3 py-3 text-center">
        {devolucao.transaction_id ? (
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-mono text-blue-600">
              {devolucao.transaction_id.slice(0, 12)}...
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>
    </>
  );
}
