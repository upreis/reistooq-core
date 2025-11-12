/**
 * 📦 CÉLULAS DE DADOS DE PACK E COMPLEMENTARES (FASE 2)
 * Pack ID, Is Pack?, Cancel Detail, Seller Custom Field
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Package, XCircle, Tag, Layers } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface PackDataCellsProps {
  devolucao: DevolucaoAvancada;
}

export function PackDataCells({ devolucao }: PackDataCellsProps) {
  return (
    <>
      {/* Pack ID */}
      <td className="px-3 py-3 text-center">
        {devolucao.pack_id ? (
          <div className="flex items-center justify-center gap-1">
            <Package className="h-3 w-3 text-blue-600" />
            <span className="text-sm font-mono">{devolucao.pack_id}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Is Pack? */}
      <td className="px-3 py-3 text-center">
        {devolucao.is_pack !== null && devolucao.is_pack !== undefined ? (
          <Badge variant={devolucao.is_pack ? 'default' : 'outline'}>
            <Layers className="h-3 w-3 mr-1" />
            {devolucao.is_pack ? 'Pedido Múltiplo' : 'Pedido Único'}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Pack Items */}
      <td className="px-3 py-3 text-center">
        {devolucao.pack_items && Array.isArray(devolucao.pack_items) ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="cursor-pointer">
                  <Package className="h-3 w-3 mr-1" />
                  {devolucao.pack_items.length} itens
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {devolucao.pack_items.map((item: any, idx: number) => (
                    <div key={idx} className="text-xs border-b pb-1">
                      <strong>{item.title || `Item ${idx + 1}`}</strong>
                      <div className="text-muted-foreground">
                        SKU: {item.seller_sku || '-'} | Qtd: {item.quantity || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Cancel Detail */}
      <td className="px-3 py-3 text-center">
        {devolucao.cancel_detail ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="cursor-pointer">
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancelado
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <div className="text-xs">
                  {typeof devolucao.cancel_detail === 'string' 
                    ? devolucao.cancel_detail 
                    : JSON.stringify(devolucao.cancel_detail, null, 2)}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>

      {/* Seller Custom Field */}
      <td className="px-3 py-3 text-left">
        {devolucao.seller_custom_field ? (
          <div className="flex items-center gap-1 max-w-[200px]">
            <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate">{devolucao.seller_custom_field}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
    </>
  );
}
