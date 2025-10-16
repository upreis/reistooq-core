import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';
import { 
  extractCancelReason, 
  extractDetailedReason, 
  extractMessageText,
  extractLastMessageText 
} from '@/features/devolucoes/utils/extractDevolucaoData';

interface DevolucaoTableRowProps {
  devolucao: DevolucaoAvancada;
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

export const DevolucaoTableRow = React.memo<DevolucaoTableRowProps>(({
  devolucao,
  onViewDetails
}) => {
  // Extração de dados
  const orderData = devolucao.dados_order || {};
  const claimData = devolucao.dados_claim || {};
  const returnData = devolucao.dados_return || {};
  
  // 🛡️ DETECÇÃO MELHORADA: Verificar dados de claim tanto em claimData quanto em orderData
  const temClaimData = (
    (claimData && Object.keys(claimData).length > 0) || // Dados diretos do claim
    !!devolucao.claim_id || // Tem claim_id
    !!orderData?.cancel_detail?.code || // Dados de cancelamento no order
    (orderData?.status === 'cancelled') || // Order cancelado
    (orderData?.mediations && Array.isArray(orderData.mediations) && orderData.mediations.length > 0) // Tem mediações
  );
  
  const temReturnData = returnData && Object.keys(returnData).length > 0;
  const temMediationData = orderData?.mediations || devolucao.em_mediacao;
  const temAttachmentsData = devolucao.anexos_count && devolucao.anexos_count > 0;

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return String(date);
    }
  };

  return (
    <tr className="border-b hover:bg-muted/30 dark:hover:bg-muted/20">
      {/* Claim ID */}
      <td className="px-3 py-3 font-medium text-purple-600 dark:text-purple-400 whitespace-nowrap">
        {devolucao.claim_id || devolucao.order_id}
      </td>
      
      {/* Data */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {formatDate(devolucao.data_criacao_claim || devolucao.data_criacao)}
      </td>
      
      {/* Status */}
      <td className="px-3 py-3 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          devolucao.status_devolucao === 'completed' 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : devolucao.status_devolucao === 'cancelled'
            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
        }`}>
          {devolucao.status_devolucao}
        </span>
      </td>
      
      {/* Comprador */}
      <td className="px-3 py-3 text-foreground whitespace-nowrap">
        {devolucao.comprador_nickname || 'N/A'}
      </td>
      
      {/* Produto */}
      <td className="px-3 py-3">
        <div className="max-w-[200px]">
          <div className="font-medium text-foreground truncate" title={devolucao.produto_titulo}>
            {devolucao.produto_titulo || 'N/A'}
          </div>
        </div>
      </td>
      
      {/* Valor */}
      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400 font-semibold whitespace-nowrap">
        {formatCurrency(devolucao.valor_retido)}
      </td>
      
      {/* Método Pagamento */}
      <td className="px-3 py-3 text-foreground text-sm whitespace-nowrap">
        {devolucao.metodo_pagamento || '-'}
      </td>
      
      {/* Ações */}
      <td className="px-3 py-3 text-center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewDetails(devolucao)}
          className="whitespace-nowrap"
        >
          Ver Detalhes
        </Button>
      </td>
      
    </tr>
  );
});
