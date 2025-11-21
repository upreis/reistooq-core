/**
 * 📋 DEFINIÇÕES DAS COLUNAS DA TABELA DE RECLAMAÇÕES
 */

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowUpDown, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImpactoFinanceiroCell } from '@/components/ml/reclamacoes/ImpactoFinanceiroCell';
import { Button } from '@/components/ui/button';
import { StatusAnaliseSelect } from './StatusAnaliseSelect';
import { ReclamacaoLifecycleBadge } from './ReclamacaoLifecycleBadge';
import { ProductInfoCell } from '@/components/devolucoes/ProductInfoCell';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '../types/devolucao-analise.types';
import { AnalysisDeadlineCell } from '@/features/devolucao2025/components/cells/AnalysisDeadlineCell';

export type ReclamacaoRow = any;

// Dicionário de traduções
const translations: Record<string, string> = {
  // Tipos de Recurso
  'order': 'Pedido',
  'shipping': 'Envio',
  'shipment': 'Envio',
  'item': 'Item',
  'payment': 'Pagamento',
  'product': 'Produto',
  
  // Frases completas do Nome da Razão
  'estimated delivery out of time': 'Entrega Estimada Fora do Prazo',
  'entregue but not receive embalagem': 'Entregue Mas Não Recebeu Embalagem',
  'diferente color or size': 'Cor ou Tamanho Diferente',
  'different than published': 'Diferente do Publicado',
  'diferente than published': 'Diferente do Publicado',
  
  // Nomes e Categorias de Razão
  'missing_accessories': 'Acessórios Faltando',
  'missing_parts': 'Peças Faltando',
  'different_product': 'Produto Diferente',
  'defective_product': 'Produto com Defeito',
  'damaged_product': 'Produto Danificado',
  'wrong_product': 'Produto Errado',
  'late_delivery': 'Entrega Atrasada',
  'not_delivered': 'Não Entregue',
  'incomplete_order': 'Pedido Incompleto',
  'quality_issues': 'Problemas de Qualidade',
  'description_mismatch': 'Descrição Não Corresponde',
  'warranty_issues': 'Problemas de Garantia',
  'packaging_issues': 'Problemas de Embalagem',
  
  // Nome da Razão (adicionados das imagens)
  'repentant': 'Arrependido',
  'comprador': 'Comprador',
  'repentant comprador': 'Comprador Arrependido',
  'broken item': 'Item Quebrado',
  'broken': 'Quebrado',
  'damaged package': 'Embalagem Danificada',
  'damaged': 'Danificado',
  'package': 'Embalagem',
  'embalagem': 'Embalagem',
  'not working item': 'Item Não Funciona',
  'not working': 'Não Funciona',
  'working': 'Funciona',
  'different item other': 'Item Diferente Outro',
  'different item': 'Item Diferente',
  'different': 'Diferente',
  'diferente': 'Diferente',
  'other': 'Outro',
  'missing item': 'Item Faltando',
  'missing': 'Faltando',
  'undelivered other': 'Não Entregue Outro',
  'undelivered': 'Não Entregue',
  'published': 'Publicado',
  'than': 'do que',
  
  // Palavras adicionais para tradução composta
  'estimated': 'Estimada',
  'delivery': 'Entrega',
  'entregue': 'Entregue',
  'out': 'Fora',
  'of': 'do',
  'time': 'Prazo',
  'but': 'Mas',
  'not': 'Não',
  'receive': 'Recebeu',
  'color': 'Cor',
  'or': 'ou',
  'size': 'Tamanho',
  
  // Categoria
  'generic': 'Genérico',
  
  // Resolução Beneficiada
  'buyer': 'Comprador',
  'seller': 'Vendedor',
  'both': 'Ambos',
  'none': 'Nenhum',
  'platform': 'Plataforma',
  'complainant': 'Reclamante',
  'respondent': 'Réu',
  
  // Razões de Resolução
  'item returned': 'Item Devolvido',
  'returned': 'Devolvido',
  'coverage decision': 'Decisão de Cobertura',
  'coverage': 'Cobertura',
  'decision': 'Decisão',
  'low cost': 'Baixo Custo',
  'low': 'Baixo',
  'cost': 'Custo',
  'refund': 'Reembolso',
  'refunded': 'Reembolsado',
  'replacement': 'Substituição',
  'partial refund': 'Reembolso Parcial',
  'partially refunded': 'Parcialmente Reembolsado',
  'partial': 'Parcial',
  'partially': 'Parcialmente',
  'no action': 'Sem Ação',
  'action': 'Ação',
  'store credit': 'Crédito na Loja',
  'store': 'Loja',
  'credit': 'Crédito',
  'return': 'Devolução',
  'exchange': 'Troca',
  'warehouse': 'Armazém',
  'preferred to keep': 'Preferiu Manter',
  'preferred': 'Preferiu',
  'keep': 'Manter',
  'timeout': 'Expirado',
  'to': 'para',
  
  // Status da Venda (Order Status - Conforme API ML)
  'confirmed': 'Confirmado',
  'payment_required': 'Aguardando Pagamento',
  'payment_in_process': 'Processando Pagamento',
  'partially_paid': 'Parcialmente Pago',
  'paid': 'Pago',
  'partially_refunded': 'Parcialmente Reembolsado',
  'pending_cancel': 'Cancelamento Pendente',
  'cancelled': 'Cancelado',
  'invalid': 'Inválido',
  'pending': 'Pendente',
  'delivered': 'Entregue',
  'shipped': 'Enviado',
};

/**
 * Traduz e formata textos do inglês para português
 * Converte snake_case para espaços e traduz termos conhecidos
 */
const translateText = (text: string | null | undefined): string => {
  if (!text) return '-';
  
  const lowerText = text.toLowerCase().trim();
  
  // Verifica se existe tradução direta da frase completa
  if (translations[lowerText]) {
    return translations[lowerText];
  }
  
  // Converte snake_case e underscores para espaços
  const withSpaces = lowerText.replace(/_/g, ' ');
  
  // Verifica novamente após conversão
  if (translations[withSpaces]) {
    return translations[withSpaces];
  }
  
  // Traduz palavra por palavra
  const translated = withSpaces
    .split(' ')
    .map(word => {
      // Remove pontuação para traduzir
      const cleanWord = word.replace(/[.,;!?]/g, '');
      return translations[cleanWord] || word;
    })
    .join(' ');
  
  // Capitaliza primeira letra de cada palavra
  const capitalized = translated
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return capitalized;
};


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

export const reclamacoesColumns = (
  onStatusChange?: (claimId: string, newStatus: StatusAnalise) => void,
  onDeleteReclamacao?: (claimId: string) => void,
  onOpenAnotacoes?: (claim: any) => void,
  anotacoes?: Record<string, string>,
  activeTab?: 'ativas' | 'historico', // ✨ NOVO: Controla quais status mostrar no dropdown
  visibleColumnIds?: string[] // ✨ IDs das colunas visíveis
): ColumnDef<ReclamacaoRow>[] => {
  const allColumns: ColumnDef<ReclamacaoRow>[] = [
  // 🎯 COLUNA DE ANÁLISE - PRIMEIRA COLUNA
  {
    id: 'status_analise',
    accessorKey: 'status_analise',
    header: () => (
      <span className="font-semibold">Análise</span>
    ),
    cell: ({ row }) => {
      const claimId = row.original.claim_id;
      const currentStatus = (row.original.status_analise_local || row.original.status_analise || 'pendente') as StatusAnalise;
      
      // ✨ Todas as opções disponíveis em ambas as abas
      const allowedStatuses = undefined; // undefined = mostrar todas
      
      return (
        <StatusAnaliseSelect
          value={currentStatus}
          onChange={(newStatus) => onStatusChange?.(claimId, newStatus)}
          allowedStatuses={allowedStatuses}
        />
      );
    },
    size: 180,
  },
  // 📝 COLUNA DE ANOTAÇÕES
  {
    id: 'anotacoes',
    header: () => (
      <div className="text-center">
        <span className="font-semibold text-xs">Anotações</span>
      </div>
    ),
    cell: ({ row }) => {
      const claimId = row.original.claim_id;
      const hasAnotacao = anotacoes?.[claimId]?.trim().length > 0;
      
      return (
        <div className="flex justify-center">
          <Button
            variant={hasAnotacao ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onOpenAnotacoes?.(row.original)}
            className="h-8 w-8 p-0"
            title={hasAnotacao ? 'Ver/Editar anotações' : 'Adicionar anotações'}
          >
            <FileText className={`h-4 w-4 ${hasAnotacao ? '' : 'text-muted-foreground'}`} />
          </Button>
        </div>
      );
    },
    size: 80,
  },
  {
    id: 'account_name',
    accessorKey: 'account_name',
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
    cell: ({ row }) => <span className="text-sm font-medium">{row.getValue('account_name') || '-'}</span>,
  },
  // 📸 COLUNA DE PRODUTO COM IMAGEM
  {
    id: 'produto',
    accessorKey: 'product_info',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Produto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const productInfo = row.original.product_info;
      return <ProductInfoCell productInfo={productInfo} />;
    },
    meta: {
      headerClassName: 'w-[350px] min-w-[350px] max-w-[350px]',
    },
  },
  // 👤 COLUNA DE COMPRADOR
  {
    id: 'buyer_nickname',
    accessorKey: 'buyer_nickname',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Comprador
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{row.getValue('buyer_nickname') || '-'}</span>,
  },
  // 📅 DATA DA VENDA
  {
    id: 'order_date_created',
    accessorKey: 'order_date_created',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Data da Venda
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('order_date_created'))}</span>,
  },
  // 📦 QUANTIDADE
  {
    id: 'order_item_quantity',
    accessorKey: 'order_item_quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Quantidade
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm text-center block">{row.getValue('order_item_quantity') || '-'}</span>,
  },
  // 💰 VALOR DO PRODUTO
  {
    id: 'order_item_unit_price',
    accessorKey: 'order_item_unit_price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Valor do Produto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue('order_item_unit_price') as number;
      const currency = row.original.amount_currency;
      return <span className="text-sm font-medium">{formatCurrency(price, currency)}</span>;
    },
  },
  // 💵 TOTAL DA VENDA
  {
    id: 'order_total',
    accessorKey: 'order_total',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Total da Venda
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const total = row.getValue('order_total') as number;
      return <span className="text-sm">{formatCurrency(total)}</span>;
    },
  },
  {
    id: 'claim_id',
    accessorKey: 'claim_id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          N.º da Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{row.getValue('claim_id')}</span>
        <ReclamacaoLifecycleBadge reclamacao={row.original} compact />
      </div>
    ),
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Tipo de Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => getTypeBadge(row.getValue('type')),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Status da Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    id: 'stage',
    accessorKey: 'stage',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Estagio da Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => getStageBadge(row.getValue('stage')),
  },
  {
    id: 'date_created',
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
    id: 'last_updated',
    accessorKey: 'last_updated',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Última Atualização
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('last_updated'))}</span>,
  },
  {
    id: 'prazo_analise',
    accessorKey: 'prazo_analise',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Prazo Análise
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const arrivalDate = row.original.data_chegada_produto;
      return <AnalysisDeadlineCell arrivalDate={arrivalDate} />;
    },
  },
  {
    id: 'order_item_seller_sku',
    accessorKey: 'order_item_seller_sku',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const sku = row.getValue('order_item_seller_sku') as string;
      if (!sku) return '-';
      return <Badge variant="outline" className="font-mono text-xs">{sku}</Badge>;
    },
  },
  {
    id: 'amount_value',
    accessorKey: 'amount_value',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Valor na Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue('amount_value') as number;
      const currency = row.original.amount_currency;
      return <span className="text-sm">{formatCurrency(amount, currency)}</span>;
    },
  },
  {
    id: 'impacto_financeiro',
    accessorKey: 'impacto_financeiro',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Impacto Financeiro
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const impacto = row.original.impacto_financeiro;
      const valor = row.original.amount_value || 0;
      const moeda = row.original.amount_currency || 'BRL';
      return <ImpactoFinanceiroCell impacto={impacto} valor={valor} moeda={moeda} />;
    },
  },
  {
    id: 'reason_id',
    accessorKey: 'reason_id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          N.º da Razão da Reclamação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('reason_id') || '-'}</span>,
  },
  {
    id: 'reason_name',
    accessorKey: 'reason_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Nome da Razão
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('reason_name'))}</span>,
  },
  {
    id: 'reason_detail',
    accessorKey: 'reason_detail',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Detalhe da Razão
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('reason_detail'))}</span>,
  },
  {
    id: 'reason_category',
    accessorKey: 'reason_category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Categoria da Razão
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('reason_category'))}</span>,
  },
  {
    id: 'resource_id',
    accessorKey: 'resource_id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          N.º do Recurso Origem
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('resource_id') || '-'}</span>,
  },
  {
    id: 'resource',
    accessorKey: 'resource',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Tipo do Recurso
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('resource'))}</span>,
  },
  {
    id: 'resolution_benefited',
    accessorKey: 'resolution_benefited',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Resolução Beneficiada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('resolution_benefited'))}</span>,
  },
  {
    id: 'resolution_reason',
    accessorKey: 'resolution_reason',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Razão da Resolução
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('resolution_reason'))}</span>,
  },
  {
    id: 'resolution_date',
    accessorKey: 'resolution_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Data da Resolução
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{formatDate(row.getValue('resolution_date'))}</span>,
  },
  {
    id: 'site_id',
    accessorKey: 'site_id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Site ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('site_id') || '-'}</span>,
  },
  {
    id: 'order_item_title',
    accessorKey: 'order_item_title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Nome do Produto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{row.getValue('order_item_title') || '-'}</span>,
  },
  {
    id: 'tem_trocas',
    accessorKey: 'tem_trocas',
    header: () => <span className="font-semibold text-sm">Trocas</span>,
    cell: ({ row }) => {
      const temTrocas = row.getValue('tem_trocas');
      return temTrocas ? <Badge variant="outline">Sim</Badge> : <span className="text-muted-foreground text-xs">Não</span>;
    },
  },
  {
    id: 'tem_mediacao',
    accessorKey: 'tem_mediacao',
    header: () => <span className="font-semibold text-sm">Mediação</span>,
    cell: ({ row }) => {
      const temMediacao = row.getValue('tem_mediacao');
      return temMediacao ? <Badge variant="destructive">Sim</Badge> : <span className="text-muted-foreground text-xs">Não</span>;
    },
  },
  {
    id: 'order_id',
    accessorKey: 'order_id',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          N.º da Venda
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('order_id') || '-'}</span>,
  },
  {
    id: 'order_status',
    accessorKey: 'order_status',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Status da Venda
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="text-sm">{translateText(row.getValue('order_status'))}</span>,
  },
  {
    id: 'tracking_number',
    accessorKey: 'tracking_number',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Número de Rastreio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('tracking_number') || '-'}</span>,
  },
  // ⚙️ AÇÕES
  {
    id: 'actions',
    header: () => <span className="font-semibold text-sm">Ações</span>,
    cell: ({ row }) => {
      const claimId = row.original.claim_id;
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteReclamacao?.(claimId)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          title="Excluir reclamação"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
    size: 80,
  }
];

  // Filtrar colunas com base em visibleColumnIds
  if (visibleColumnIds && visibleColumnIds.length > 0) {
    return allColumns.filter(col => visibleColumnIds.includes(col.id as string));
  }
  
  return allColumns;
};
