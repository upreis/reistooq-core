/**
 * 📦 CÉLULAS DE RASTREAMENTO PRIORITÁRIAS
 * Data Estimada Entrega | Tem Atraso? | Qtd Devolvida/Total
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Package } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface TrackingPriorityCellsProps {
  devolucao: DevolucaoAvancada;
}

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

export function TrackingPriorityCells({ devolucao }: TrackingPriorityCellsProps) {
  // 🐛 DEBUG: Ver campos de tracking
  console.log('🔍 TrackingPriorityCells - estimated_delivery_date:', devolucao.estimated_delivery_date);
  console.log('🔍 TrackingPriorityCells - has_delay:', devolucao.has_delay);
  
  const returnQty = devolucao.return_quantity ?? devolucao.quantidade_devolvida ?? 0;
  const totalQty = devolucao.total_quantity ?? devolucao.quantidade ?? 0;

  return (
    <>
      {/* Data Estimada Entrega */}
      <td className="px-3 py-3 text-center">
        {devolucao.estimated_delivery_date ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(devolucao.estimated_delivery_date)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>

      {/* Tem Atraso? */}
      <td className="px-3 py-3 text-center">
        {devolucao.has_delay === true ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Atrasado
          </Badge>
        ) : devolucao.has_delay === false ? (
          <Badge variant="outline" className="text-muted-foreground">
            No Prazo
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </td>

      {/* Qtd Devolvida/Total */}
      <td className="px-3 py-3 text-center">
        {returnQty > 0 || totalQty > 0 ? (
          <div className="flex items-center justify-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {returnQty}/{totalQty}
            </span>
            {returnQty === totalQty && totalQty > 0 && (
              <Badge variant="outline" className="text-xs">
                Total
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
