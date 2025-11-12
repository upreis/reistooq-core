import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Award, Crown } from 'lucide-react';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface IdentificationCellsProps {
  devolucao: DevolucaoAvancada;
}

const getPowerSellerBadge = (status: string | null | undefined) => {
  if (!status) return <span className="text-muted-foreground">-</span>;
  
  const statusMap: Record<string, { variant: "default" | "secondary" | "outline", icon?: React.ReactNode }> = {
    'platinum': { variant: 'default', icon: <Crown className="h-3 w-3 mr-1" /> },
    'gold': { variant: 'secondary', icon: <Award className="h-3 w-3 mr-1" /> },
    'silver': { variant: 'outline', icon: <Award className="h-3 w-3 mr-1" /> }
  };
  
  const config = statusMap[status.toLowerCase()] || { variant: 'outline' as const };
  
  return (
    <Badge variant={config.variant} className="inline-flex items-center">
      {config.icon}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

const getMercadoLiderBadge = (isMercadoLider: boolean) => {
  if (!isMercadoLider) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  return (
    <Badge variant="default" className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600">
      <Crown className="h-3 w-3 mr-1" />
      ML+
    </Badge>
  );
};

const formatCPFCNPJ = (doc: string | null | undefined): string => {
  if (!doc) return '-';
  
  // Remove caracteres não numéricos
  const numbers = doc.replace(/\D/g, '');
  
  // CPF: 000.000.000-00
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  // CNPJ: 00.000.000/0000-00
  if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Retornar original se não for CPF nem CNPJ
  return doc;
};

export const IdentificationCells: React.FC<IdentificationCellsProps> = ({ devolucao }) => {
  return (
    <>
      {/* 🆕 FASE 1: CPF/CNPJ */}
      <td className="px-3 py-3 text-center font-mono text-sm">
        {formatCPFCNPJ(devolucao.comprador_cpf)}
      </td>
      
      {/* 🆕 FASE 2: Power Seller */}
      <td className="px-3 py-3 text-center">
        {getPowerSellerBadge(devolucao.power_seller_status)}
      </td>
      
      {/* 🆕 FASE 2: Mercado Líder */}
      <td className="px-3 py-3 text-center">
        {getMercadoLiderBadge(devolucao.mercado_lider || false)}
      </td>
      
      {/* Claim ID */}
      <td className="px-3 py-3 text-center font-mono text-purple-600 dark:text-purple-400">
        {devolucao.claim_id || '-'}
      </td>
      
      {/* Pedido ID */}
      <td className="px-3 py-3 text-center font-mono text-blue-600 dark:text-blue-400">
        {devolucao.order_id || '-'}
      </td>
      
      {/* Return ID */}
      <td className="px-3 py-3 text-center font-mono text-green-600 dark:text-green-400">
        {devolucao.return_id || '-'}
      </td>
    </>
  );
};
