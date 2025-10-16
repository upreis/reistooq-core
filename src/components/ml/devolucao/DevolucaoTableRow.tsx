import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DevolucaoAvancada } from '@/features/devolucoes/types/devolucao-avancada.types';

interface DevolucaoTableRowProps {
  devolucao: DevolucaoAvancada;
  onViewDetails: (devolucao: DevolucaoAvancada) => void;
}

// Função auxiliar para formatar moeda
const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para formatar data e hora
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

// Função auxiliar para formatar data
const formatDate = (date: string | null | undefined): string => {
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

// Função auxiliar para Badge de Status
const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="outline">-</Badge>;
  
  const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
    'completed': { variant: 'default', label: 'Completo' },
    'cancelled': { variant: 'destructive', label: 'Cancelado' },
    'closed': { variant: 'secondary', label: 'Fechado' },
    'opened': { variant: 'outline', label: 'Aberto' },
    'pending': { variant: 'outline', label: 'Pendente' }
  };
  
  const config = statusMap[status] || { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Função auxiliar para Badge de Complexidade
const getComplexityBadge = (level: string | null | undefined) => {
  if (!level) return <span className="text-muted-foreground">-</span>;
  
  const levelMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
    'high': { variant: 'destructive', label: 'Alta' },
    'medium': { variant: 'outline', label: 'Média' },
    'low': { variant: 'secondary', label: 'Baixa' }
  };
  
  const config = levelMap[level] || { variant: 'outline' as const, label: level };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const DevolucaoTableRow = React.memo<DevolucaoTableRowProps>(({
  devolucao,
  onViewDetails
}) => {
  // Extração de dados
  const orderData = devolucao.dados_order || {};
  const claimData = devolucao.dados_claim || {};
  
  return (
    <tr className="border-b hover:bg-muted/30 dark:hover:bg-muted/20">
      {/* GRUPO 1: IDENTIFICAÇÃO */}
      
      {/* Claim ID */}
      <td className="px-3 py-3 text-center font-mono text-purple-600 dark:text-purple-400">
        {devolucao.claim_id || '-'}
      </td>
      
      {/* Pedido ID */}
      <td className="px-3 py-3 text-center font-mono text-blue-600 dark:text-blue-400">
        {devolucao.order_id || '-'}
      </td>
      
      {/* Item ID */}
      <td className="px-3 py-3 text-center font-mono text-foreground">
        {(devolucao.dados_order as any)?.order_items?.[0]?.item?.id || '-'}
      </td>
      
      {/* SKU */}
      <td className="px-3 py-3 text-center font-mono text-foreground">
        {devolucao.sku || '-'}
      </td>
      
      {/* GRUPO 2: DATAS E TIMELINE */}
      
      {/* Data Criação */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_criacao_claim || devolucao.data_criacao)}
      </td>
      
      {/* Data Fechamento */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_fechamento_claim)}
      </td>
      
      {/* Início Devolução */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_inicio_return)}
      </td>
      
      {/* Primeira Ação */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.data_primeira_acao)}
      </td>
      
      {/* Prazo Limite */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        {formatDateTime(devolucao.tempo_limite_acao)}
      </td>
      
      {/* GRUPO 3: STATUS E ESTADO */}
      
      {/* Status */}
      <td className="px-3 py-3 text-center">
        {getStatusBadge(devolucao.status_devolucao)}
      </td>
      
      {/* Etapa */}
      <td className="px-3 py-3 text-center">
        {devolucao.claim_stage ? <Badge variant="outline">{devolucao.claim_stage}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* Resolução */}
      <td className="px-3 py-3 text-center">
        {devolucao.resultado_final ? <Badge variant="secondary">{devolucao.resultado_final}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* Status Reembolso */}
      <td className="px-3 py-3 text-center">
        {devolucao.metodo_reembolso ? <Badge variant="default">{devolucao.metodo_reembolso}</Badge> : <span className="text-muted-foreground">-</span>}
      </td>
      
      {/* GRUPO 4: COMPRADOR */}
      
      {/* Comprador */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nome_completo || devolucao.comprador_nickname || '-'}
      </td>
      
      {/* Nickname */}
      <td className="px-3 py-3 text-left">
        {devolucao.comprador_nickname || '-'}
      </td>
      
      {/* Email */}
      <td className="px-3 py-3 text-left text-xs">
        {(devolucao.dados_order as any)?.buyer?.email || '-'}
      </td>
      
      {/* GRUPO 5: PRODUTO */}
      
      {/* Produto */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[250px] truncate" title={devolucao.produto_titulo || ''}>
          {devolucao.produto_titulo || '-'}
        </div>
      </td>
      
      {/* Qtd */}
      <td className="px-3 py-3 text-center font-medium">
        {devolucao.quantidade || 1}
      </td>
      
      {/* Categoria */}
      <td className="px-3 py-3 text-left">
        {devolucao.produto_categoria || '-'}
      </td>
      
      {/* GRUPO 6: VALORES FINANCEIROS */}
      
      {/* Valor Total */}
      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap">
        {formatCurrency((devolucao.dados_order as any)?.total_amount || devolucao.valor_retido)}
      </td>
      
      {/* Valor Retido */}
      <td className="px-3 py-3 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
        {formatCurrency(devolucao.valor_retido)}
      </td>
      
      {/* Reembolso */}
      <td className="px-3 py-3 text-right font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
        {formatCurrency(devolucao.valor_reembolso_total)}
      </td>
      
      {/* Pagamento */}
      <td className="px-3 py-3 text-center">
        {devolucao.metodo_pagamento ? (
          <Badge variant="outline">{devolucao.metodo_pagamento}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* GRUPO 7: MOTIVO E CATEGORIA */}
      
      {/* Reason ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.reason_id || claimData?.reason_id || '-'}
      </td>
      
      {/* Categoria Motivo */}
      <td className="px-3 py-3 text-left">
        {devolucao.reason_category ? (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {devolucao.reason_category}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* Tipo Problema */}
      <td className="px-3 py-3 text-left">
        {devolucao.categoria_problema || '-'}
      </td>
      
      {/* Subtipo */}
      <td className="px-3 py-3 text-left">
        {devolucao.subcategoria_problema || '-'}
      </td>
      
      {/* Complexidade */}
      <td className="px-3 py-3 text-center">
        {getComplexityBadge(devolucao.nivel_complexidade)}
      </td>
      
      {/* GRUPO 8: MEDIAÇÃO */}
      
      {/* Resultado Mediação */}
      <td className="px-3 py-3 text-left">
        {devolucao.resultado_mediacao || '-'}
      </td>
      
      {/* Mediador */}
      <td className="px-3 py-3 text-left">
        {devolucao.mediador_ml || '-'}
      </td>
      
      {/* Feedback Comprador */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[180px] truncate" title={devolucao.feedback_comprador_final || ''}>
          {devolucao.feedback_comprador_final || '-'}
        </div>
      </td>
      
      {/* Feedback Vendedor */}
      <td className="px-3 py-3 text-left">
        <div className="max-w-[180px] truncate" title={devolucao.feedback_vendedor || ''}>
          {devolucao.feedback_vendedor || '-'}
        </div>
      </td>
      
      {/* GRUPO 9: TEMPOS E MÉTRICAS */}
      
      {/* Tempo Resposta */}
      <td className="px-3 py-3 text-center">
        {devolucao.tempo_resposta_comprador ? `${devolucao.tempo_resposta_comprador}h` : '-'}
      </td>
      
      {/* Tempo Análise */}
      <td className="px-3 py-3 text-center">
        {devolucao.tempo_analise_ml ? `${devolucao.tempo_analise_ml}h` : '-'}
      </td>
      
      {/* GRUPO 10: RASTREAMENTO */}
      
      {/* Shipment ID */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.shipment_id || '-'}
      </td>
      
      {/* Rastreio */}
      <td className="px-3 py-3 text-center font-mono text-xs">
        {devolucao.codigo_rastreamento || '-'}
      </td>
      
      {/* Transportadora */}
      <td className="px-3 py-3 text-left">
        {devolucao.transportadora || '-'}
      </td>
      
      {/* Status Envio */}
      <td className="px-3 py-3 text-center">
        {devolucao.status_rastreamento_pedido ? (
          <Badge variant="outline">{devolucao.status_rastreamento_pedido}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      
      {/* GRUPO 11: SISTEMA */}
      
      {/* Última Sync */}
      <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(devolucao.ultima_sincronizacao)}
      </td>
      
      {/* Criado em */}
      <td className="px-3 py-3 text-center whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(devolucao.created_at)}
      </td>
      
      {/* AÇÕES */}
      <td className="px-3 py-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(devolucao)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
});
