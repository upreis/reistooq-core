/**
 * 📋 DEFINIÇÕES DAS COLUNAS DA TABELA DE RECLAMAÇÕES
 */

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImpactoFinanceiroCell } from '@/components/ml/reclamacoes/ImpactoFinanceiroCell';
import { Button } from '@/components/ui/button';

export type ReclamacaoRow = any;

const getStatusBadge = (status: string) => {
  const variants: Record<string, any> = {
    opened: { variant: 'default', label: 'Aberta' },
    closed: { variant: 'secondary', label: 'Fechada' },
    under_review: { variant: 'outline', label: 'Em análise' }
  };
  const config = variants[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getTypeBadge = (type: string) => {
  const typeConfig: Record<string, { variant: any; label: string; className?: string }> = {
    mediations: { variant: 'destructive', label: 'Mediação' },
    returns: { variant: 'outline', label: 'Devolução', className: 'bg-yellow-400 text-black border-yellow-500 font-semibold' },
    fulfillment: { variant: 'secondary', label: 'Full' },
    ml_case: { variant: 'outline', label: 'ML Case' },
    cancel_sale: { variant: 'outline', label: 'Cancelamento Vendedor' },
    cancel_purchase: { variant: 'outline', label: 'Cancelamento Comprador' },
    change: { variant: 'default', label: 'Troca' },
    service: { variant: 'secondary', label: 'Serviço' }
  };
  const config = typeConfig[type] || { variant: 'default', label: type };
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
};

const getStageBadge = (stage: string | null) => {
  if (!stage) return '-';
  const stageConfig: Record<string, { variant: any; label: string }> = {
    claim: { variant: 'default', label: 'Reclamação' },
    dispute: { variant: 'destructive', label: 'Mediação ML' },
    recontact: { variant: 'secondary', label: 'Recontato' },
    none: { variant: 'outline', label: 'N/A' },
    stale: { variant: 'outline', label: 'Stale' }
  };
  const config = stageConfig[stage] || { variant: 'default', label: stage };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd/MM/yy HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
};

const formatCurrency = (value: number | null, currency: string = 'BRL') => {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
};

export const reclamacoesColumns: ColumnDef<ReclamacaoRow>[] = [
  {
    accessorKey: 'empresa',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Empresa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{row.getValue('empresa') || '-'}</span>,
  },
  {
    accessorKey: 'claim_id',
    header: 'N.º da Reclamação',
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('claim_id')}</span>,
  },
  {
    accessorKey: 'type',
    header: 'Tipo de Reclamação',
    cell: ({ row }) => getTypeBadge(row.getValue('type')),
  },
  {
    accessorKey: 'status',
    header: 'Status da Reclamação',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    accessorKey: 'stage',
    header: 'Estagio da Reclamação',
    cell: ({ row }) => getStageBadge(row.getValue('stage')),
  },
  {
    accessorKey: 'resource_id',
    header: 'N.º do Recurso Origem',
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('resource_id') || '-'}</span>,
  },
  {
    accessorKey: 'resource',
    header: 'Tipo do Recurso',
    cell: ({ row }) => <span className="text-sm">{row.getValue('resource') || '-'}</span>,
  },
  {
    accessorKey: 'reason_id',
    header: 'N.º da Razão da Reclamação',
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('reason_id') || '-'}</span>,
  },
  {
    accessorKey: 'date_created',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Data Criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('date_created'))}</span>,
  },
  {
    accessorKey: 'last_updated',
    header: 'Última Atualização',
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('last_updated'))}</span>,
  },
  {
    accessorKey: 'site_id',
    header: 'Site ID',
    cell: ({ row }) => <span className="text-sm">{row.getValue('site_id') || '-'}</span>,
  },
  {
    accessorKey: 'reason_name',
    header: 'Nome da Razão',
    cell: ({ row }) => <span className="max-w-[200px] block whitespace-normal break-words">{row.getValue('reason_name') || '-'}</span>,
  },
  {
    accessorKey: 'reason_detail',
    header: 'Detalhe da Razão',
    cell: ({ row }) => <span className="max-w-[12.5rem] block whitespace-normal break-words text-sm">{row.getValue('reason_detail') || '-'}</span>,
  },
  {
    accessorKey: 'reason_category',
    header: 'Categoria da Razão',
    cell: ({ row }) => <span className="text-sm">{row.getValue('reason_category') || '-'}</span>,
  },
  {
    accessorKey: 'order_date_created',
    header: 'Data da Venda',
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('order_date_created'))}</span>,
  },
  {
    accessorKey: 'buyer_nickname',
    header: 'Nome do Cliente',
    cell: ({ row }) => <span className="text-sm">{row.getValue('buyer_nickname') || '-'}</span>,
  },
  {
    accessorKey: 'order_item_title',
    header: 'Nome do Produto',
    cell: ({ row }) => <span className="max-w-[250px] text-sm truncate block">{row.getValue('order_item_title') || '-'}</span>,
  },
  {
    accessorKey: 'order_item_quantity',
    header: 'Quantidade',
    cell: ({ row }) => <span className="text-sm text-center block">{row.getValue('order_item_quantity') || '-'}</span>,
  },
  {
    accessorKey: 'order_item_unit_price',
    header: 'Valor do Produto',
    cell: ({ row }) => {
      const price = row.getValue('order_item_unit_price') as number;
      const currency = row.original.amount_currency;
      return <span className="text-sm font-medium">{formatCurrency(price, currency)}</span>;
    },
  },
  {
    accessorKey: 'order_item_seller_sku',
    header: 'SKU',
    cell: ({ row }) => <span className="font-mono text-xs whitespace-normal break-words">{row.getValue('order_item_seller_sku') || '-'}</span>,
  },
  {
    accessorKey: 'amount_value',
    header: 'Valor na Reclamação',
    cell: ({ row }) => {
      const value = row.getValue('amount_value') as number;
      const currency = row.original.amount_currency;
      return <span className="text-sm font-medium">{formatCurrency(value, currency)}</span>;
    },
  },
  {
    accessorKey: 'resolution_benefited',
    header: 'Resolução Beneficiada',
    cell: ({ row }) => <span className="text-sm">{row.getValue('resolution_benefited') || '-'}</span>,
  },
  {
    accessorKey: 'resolution_date',
    header: 'Data da Resolução',
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('resolution_date'))}</span>,
  },
  {
    accessorKey: 'resolution_reason',
    header: 'Razão da Resolução',
    cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.getValue('resolution_reason') || '-'}</span>,
  },
  {
    accessorKey: 'tem_trocas',
    header: () => <div className="text-center">Trocas</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue('tem_trocas') ? <Package className="h-4 w-4 inline text-green-500" /> : '-'}
      </div>
    ),
  },
  {
    accessorKey: 'tem_mediacao',
    header: () => <div className="text-center">Mediação</div>,
    cell: ({ row }) => (
      <div className="text-center">
        {row.getValue('tem_mediacao') ? '✅' : '-'}
      </div>
    ),
  },
  {
    accessorKey: 'order_id',
    header: 'N.º da Venda',
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('order_id') || '-'}</span>,
  },
  {
    accessorKey: 'order_status',
    header: 'Status da Venda',
    cell: ({ row }) => <span className="text-sm">{row.getValue('order_status') || '-'}</span>,
  },
  {
    accessorKey: 'order_total',
    header: 'Total da Venda',
    cell: ({ row }) => {
      const total = row.getValue('order_total') as number;
      return <span className="text-sm">{formatCurrency(total)}</span>;
    },
  },
  {
    accessorKey: 'impacto_financeiro',
    header: 'Impacto Financeiro',
    cell: ({ row }) => {
      const impacto = row.getValue('impacto_financeiro') as 'coberto_ml' | 'ganho' | 'neutro' | 'perda';
      const valor = impacto === 'neutro' 
        ? (row.original.amount_value || 0)
        : (row.original.valor_impacto || 0);
      const moeda = row.original.amount_currency || 'BRL';
      
      return (
        <ImpactoFinanceiroCell
          impacto={impacto}
          valor={valor}
          moeda={moeda}
        />
      );
    },
  },
];
