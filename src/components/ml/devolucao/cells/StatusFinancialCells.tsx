/**
 * ✅ CORREÇÃO 3: Células de Status Financeiro e Tipo de Recurso
 * Exibe Status $ (status_money) e Tipo Recurso (resource_type)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface StatusFinancialCellsProps {
  devolucao: DevolucaoAvancada;
}

const getStatusMoneyBadgeVariant = (statusMoney: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
  if (!statusMoney) return 'outline';
  
  switch (statusMoney) {
    case 'refunded':
      return 'default'; // Verde - dinheiro reembolsado
    case 'available':
      return 'secondary'; // Azul - dinheiro disponível
    case 'retained':
      return 'destructive'; // Vermelho - dinheiro retido
    default:
      return 'outline';
  }
};

const getStatusMoneyLabel = (statusMoney: string | null | undefined): string => {
  if (!statusMoney) return '-';
  
  const labels: Record<string, string> = {
    'retained': 'Retido',
    'refunded': 'Reembolsado',
    'available': 'Disponível',
  };
  
  return labels[statusMoney] || statusMoney;
};

const getResourceTypeLabel = (resourceType: string | null | undefined): string => {
  if (!resourceType) return '-';
  
  const labels: Record<string, string> = {
    'order': 'Pedido',
    'claim': 'Reclamação',
    'shipment': 'Envio',
    'other': 'Outro',
  };
  
  return labels[resourceType] || resourceType;
};

export const StatusFinancialCells: React.FC<StatusFinancialCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* ✅ Status $ (status_money) */}
      <td className="px-3 py-3 text-center">
        <Badge variant={getStatusMoneyBadgeVariant(devolucao.status_money)}>
          {getStatusMoneyLabel(devolucao.status_money)}
        </Badge>
      </td>
      
      {/* ✅ Tipo Recurso (resource_type) */}
      <td className="px-3 py-3 text-center">
        <Badge variant="outline">
          {getResourceTypeLabel(devolucao.resource_type)}
        </Badge>
      </td>
    </>
  );
};
