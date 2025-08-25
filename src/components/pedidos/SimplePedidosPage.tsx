/**
 * 🛡️ PÁGINA PEDIDOS REFATORADA - FASES 1, 2 E 3 COMPLETAS
 * Sistema blindado com arquitetura unificada + Performance + UX
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Clock, Filter, Settings, CheckSquare, CalendarIcon } from 'lucide-react';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { mapMLShippingSubstatus } from '@/utils/mlStatusMapping';
import { listPedidos } from '@/services/pedidos';
import { mapApiStatusToLabel, getStatusBadgeVariant, mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { ExportModal } from './ExportModal';
import { SavedFiltersManager } from './SavedFiltersManager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Order = {
  id: string;
  numero: string;
  nome_cliente: string;
  cpf_cnpj: string;
  data_pedido: string;
  data_prevista: string;
  situacao: string;
  valor_total: number;
  valor_frete: number;
  valor_desconto: number;
  numero_ecommerce: string;
  numero_venda: string;
  empresa: string;
  cidade: string;
  uf: string;
  codigo_rastreamento: string;
  url_rastreamento: string;
  obs: string;
  obs_interna: string;
  total_itens: number;
  itens_pedidos: Array<{
    sku: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
  integration_account_id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Campos adicionais específicos do Mercado Livre
  shipping_mode?: string;
  shipping_method?: string;
  shipping_details?: any;
  forma_entrega?: string;
  is_fulfillment?: boolean;
  status_detail?: string;
  substatus_detail?: string;
  status_order?: string;
  status_order_detail?: string;
  status_shipping?: string;
  status_shipping_detail?: string;
  status_payment?: string;
  status_payment_detail?: string;
  substatus?: string;
  
  // Campos adicionais financeiros
  transaction_amount?: number;
  paid_amount?: number;
  installments?: number;
  currency_id?: string;
  market_fee?: number;
  mercadopago_fee?: number;
  finance_fee?: number;
  discount_fee?: number;
  regular_shipping_cost?: number;
  express_shipping_cost?: number;
  coupon_amount?: number;
  net_received_amount?: number;
  shipping_list_cost?: number;
  shipping_option_cost?: number;
  shipping_cost?: number;
  additional_info?: any;
  payments?: Array<{
    id?: string;
    status?: string;
    transaction_amount?: number;
    date_created?: string;
    payment_type?: string;
    installments?: number;
    payment_method_id?: string;
  }>;
  
  // ML específicos para debug
  total_amount?: number;
  paid_amount_ml?: number;
  bonus_total?: number;
  
  // Debug financeiro (nomes originais da API)
  raw_total_amount?: any;
  raw_paid_amount?: any;
  raw_shipping_cost?: any;
  raw_shipping_payments_total?: any;
  raw_shipping_costs_gross_amount?: any;
  raw_shipping_costs_receiver_cost?: any;
  raw_shipping_costs_senders_comp_total?: any;
  raw_shipping_bonus_total?: any;
  raw_fonte?: string;
};

// ============= SISTEMA DE COLUNIZAÇÃO COMPLETO =============
const allColumns = [
    // Básicas
    { key: 'numero', label: 'Número', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Cliente', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data Pedido', default: true, category: 'basic' },
    { key: 'situacao', label: 'Status', default: true, category: 'basic' },
    
    // Produtos
    { key: 'total_itens', label: 'Qde Itens', default: true, category: 'products' },
    { key: 'primeiro_produto', label: 'Primeiro Produto', default: false, category: 'products' },
    { key: 'descricao_produtos', label: 'Descrição Produtos', default: false, category: 'products' },
    
    // Financeiras
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'valor_frete', label: 'Valor Frete', default: false, category: 'financial' },
    { key: 'valor_desconto', label: 'Desconto', default: false, category: 'financial' },
    { key: 'valor_liquido', label: 'Valor Líquido', default: false, category: 'financial' },
    { key: 'receita_com_envio', label: 'Receita com Envio', default: true, category: 'financial' },
    { key: 'desconto_cupom', label: 'Desconto Cupom', default: false, category: 'financial' },
    { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', default: false, category: 'financial' },
    { key: 'taxa_mercadolivre', label: 'Taxa MercadoLivre', default: false, category: 'financial' },
    { key: 'taxa_mercadopago', label: 'Taxa MercadoPago', default: false, category: 'financial' },
    { key: 'taxa_financeira', label: 'Taxa Financeira', default: false, category: 'financial' },
    { key: 'valor_pago', label: 'Valor Pago', default: false, category: 'financial' },
    { key: 'parcelamento', label: 'Parcelamento', default: false, category: 'financial' },
    
    // Status e situação
    { key: 'status_detalhado', label: 'Status Detalhado', default: false, category: 'status' },
    { key: 'substatus', label: 'Substatus', default: false, category: 'status' },
    { key: 'status_pagamento', label: 'Status Pagamento', default: false, category: 'status' },
    { key: 'status_envio', label: 'Status Envio', default: false, category: 'status' },
    
    // Mapeamento
    { key: 'verificacao_mapeamento', label: 'Verificação Mapping', default: true, category: 'mapping' },
    
    // Mercado Livre
    { key: 'numero_ecommerce', label: 'Número E-commerce', default: false, category: 'ml' },
    { key: 'numero_venda', label: 'Número Venda', default: false, category: 'ml' },
    { key: 'empresa', label: 'Empresa', default: false, category: 'ml' },
    
    // Envio
    { key: 'forma_entrega', label: 'Forma Entrega', default: false, category: 'shipping' },
    { key: 'is_fulfillment', label: 'Fulfillment', default: false, category: 'shipping' },
    { key: 'codigo_rastreamento', label: 'Código Rastreamento', default: false, category: 'shipping' },
    { key: 'url_rastreamento', label: 'URL Rastreamento', default: false, category: 'shipping' },
    { key: 'data_prevista', label: 'Data Prevista', default: false, category: 'shipping' },
    { key: 'substatus_detail', label: 'Substatus (Estado Atual)', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio (Combinado)', default: false, category: 'shipping' },
    { key: 'shipping_method', label: 'Método de Envio (Combinado)', default: false, category: 'shipping' },
    
    // Endereço
    { key: 'cidade', label: 'Cidade', default: false, category: 'address' },
    { key: 'uf', label: 'UF', default: false, category: 'address' },
    
    // Comprador
    { key: 'cpf_cnpj', label: 'CPF/CNPJ', default: false, category: 'buyer' },
    
    // Identificação
    { key: 'id', label: 'ID Interno', default: false, category: 'ids' },
    { key: 'created_at', label: 'Criado em', default: false, category: 'ids' },
    { key: 'obs', label: 'Observações', default: false, category: 'ids' },
    { key: 'obs_interna', label: 'Obs. Interna', default: false, category: 'ids' },

    // Debug Financeiro (nomes originais da API)
    { key: 'raw_total_amount', label: 'total_amount', default: false, category: 'debug' },
    { key: 'raw_paid_amount', label: 'paid_amount', default: false, category: 'debug' },
    { key: 'raw_shipping_cost', label: 'shipping.cost', default: false, category: 'debug' },
    { key: 'raw_shipping_payments_total', label: 'shipping.payments_total', default: false, category: 'debug' },
    { key: 'raw_shipping_costs_gross_amount', label: 'shipping.costs.gross_amount', default: false, category: 'debug' },
    { key: 'raw_shipping_costs_receiver_cost', label: 'shipping.costs.receiver.cost', default: false, category: 'debug' },
    { key: 'raw_shipping_costs_senders_comp_total', label: 'shipping.costs.senders_compensation_total', default: false, category: 'debug' },
    { key: 'raw_shipping_bonus_total', label: 'shipping.bonus_total', default: false, category: 'debug' },
    { key: 'raw_fonte', label: 'fonte', default: false, category: 'debug' },
  ];

export default function SimplePedidosPage() {
  // ============= ESTADO BASE =============
  const {
    state,
    actions,
    filters
  } = usePedidosManager();

  // Extrair dados processados do state
  const orders = (state as any).rows || [];
  const loading = state.loading;
  const error = state.error;
  const total = (state as any).total;

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(allColumns.filter(col => col.default).map(col => col.key))
  );
  const [debugFinanceiro, setDebugFinanceiro] = useState(false);

  // Alternar exibição automática das colunas de debug quando o modo diagnóstico estiver ativo
  const debugKeys = [
    'raw_total_amount',
    'raw_paid_amount',
    'raw_shipping_cost',
    'raw_shipping_payments_total',
    'raw_shipping_costs_gross_amount',
    'raw_shipping_costs_receiver_cost',
    'raw_shipping_costs_senders_comp_total',
    'raw_shipping_bonus_total',
    'raw_fonte'
  ];

  useEffect(() => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (debugFinanceiro) {
        debugKeys.forEach(k => next.add(k));
      } else {
        debugKeys.forEach(k => next.delete(k));
      }
      return next;
    });
  }, [debugFinanceiro]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resetToDefault = () => {
    setVisibleColumns(new Set(allColumns.filter(col => col.default).map(col => col.key)));
  };

  // Estados auxiliares
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [verificacoesMapeamento, setVerificacoesMapeamento] = useState<Record<string, MapeamentoVerificacao>>({});
  const [processingBaixa, setProcessingBaixa] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedPedidos, setSelectedPedidos] = useState<Set<string>>(new Set());

  // ============= PAGINAÇÃO E FILTROS =============
  const paginatedOrders = useMemo(() => {
    if (!orders?.length) return [];
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return orders.slice(start, end);
  }, [orders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((total || 0) / itemsPerPage);

  // ============= MAPEAMENTO E BAIXA =============
  useEffect(() => {
    const verificarMapeamentos = async () => {
      if (!paginatedOrders?.length) return;
      
      try {
        const novasVerificacoes: Record<string, MapeamentoVerificacao> = {};
        
        for (const pedido of paginatedOrders) {
          if (pedido.itens_pedidos?.length) {
            for (const item of pedido.itens_pedidos) {
              const verificacao = await MapeamentoService.verificarMapeamento(item.sku);
              novasVerificacoes[`${pedido.id}-${item.sku}`] = verificacao;
            }
          }
        }
        
        setVerificacoesMapeamento(novasVerificacoes);
      } catch (error) {
        console.error('Erro ao verificar mapeamentos:', error);
      }
    };

    verificarMapeamentos();
  }, [paginatedOrders]);

  const renderCell = (order: Order, column: string) => {
    const baseClasses = "text-sm";
    
    switch (column) {
      case 'numero':
        return (
          <div className={baseClasses}>
            <div className="font-medium">{order.numero}</div>
            {order.numero_ecommerce && (
              <div className="text-xs text-muted-foreground">
                E-com: {order.numero_ecommerce}
              </div>
            )}
          </div>
        );
        
      case 'nome_cliente':
        return (
          <div className={baseClasses}>
            <div className="font-medium">{order.nome_cliente}</div>
            {order.cpf_cnpj && (
              <div className="text-xs text-muted-foreground">
                {maskCpfCnpj(order.cpf_cnpj)}
              </div>
            )}
          </div>
        );
        
      case 'data_pedido':
        return <span className={baseClasses}>{formatDate(order.data_pedido)}</span>;
        
      case 'situacao':
        const statusLabel = mapApiStatusToLabel(order.situacao);
        const variant = getStatusBadgeVariant(order.situacao);
        return (
          <Badge variant={variant} className="text-xs">
            {statusLabel}
          </Badge>
        );
        
      case 'total_itens':
        return <span className={baseClasses}>{order.total_itens || 0}</span>;
        
      case 'primeiro_produto':
        const firstItem = order.itens_pedidos?.[0];
        return firstItem ? (
          <div className={baseClasses}>
            <div className="font-medium">{firstItem.sku}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {firstItem.descricao}
            </div>
          </div>
        ) : <span className={baseClasses}>-</span>;
        
      case 'descricao_produtos':
        return (
          <div className={baseClasses}>
            {order.itens_pedidos?.map((item, index) => (
              <div key={index} className="text-xs">
                {item.quantidade}x {item.sku} - {item.descricao}
              </div>
            )) || '-'}
          </div>
        );
        
      case 'valor_total':
        return <span className={baseClasses}>{formatMoney(order.valor_total)}</span>;
        
      case 'valor_frete':
        return <span className={baseClasses}>{formatMoney(order.valor_frete)}</span>;
        
      case 'valor_desconto':
        return <span className={baseClasses}>{formatMoney(order.valor_desconto)}</span>;
        
      case 'valor_liquido':
        const liquido = (order.valor_total || 0) - (order.valor_desconto || 0);
        return <span className={baseClasses}>{formatMoney(liquido)}</span>;
        
      case 'receita_com_envio':
        // Cálculo: Valor Total + Valor do Frete
        const receitaComEnvio = (order.valor_total || 0) + (order.valor_frete || 0);
        return (
          <span className={`${baseClasses} font-medium text-green-600`}>
            {formatMoney(receitaComEnvio)}
          </span>
        );
        
      case 'desconto_cupom':
        const descontoCupom = order.coupon_amount || 0;
        return <span className={baseClasses}>{formatMoney(descontoCupom)}</span>;
        
      case 'valor_liquido_vendedor':
        const valorLiquidoVendedor = order.net_received_amount || 0;
        return (
          <span className={`${baseClasses} font-medium text-blue-600`}>
            {formatMoney(valorLiquidoVendedor)}
          </span>
        );
        
      case 'taxa_mercadolivre':
        const taxaML = order.market_fee || 0;
        return <span className={baseClasses}>{formatMoney(taxaML)}</span>;
        
      case 'taxa_mercadopago':
        const taxaMP = order.mercadopago_fee || 0;
        return <span className={baseClasses}>{formatMoney(taxaMP)}</span>;
        
      case 'taxa_financeira':
        const taxaFin = order.finance_fee || 0;
        return <span className={baseClasses}>{formatMoney(taxaFin)}</span>;
        
      case 'valor_pago':
        const valorPago = order.paid_amount || order.paid_amount_ml || 0;
        return <span className={baseClasses}>{formatMoney(valorPago)}</span>;
        
      case 'parcelamento':
        const installments = order.installments || order.payments?.[0]?.installments || 1;
        return <span className={baseClasses}>{installments}x</span>;
        
      case 'verificacao_mapeamento':
        if (!order.itens_pedidos?.length) {
          return <span className={baseClasses}>-</span>;
        }
        
        const temMapeamentoPendente = order.itens_pedidos.some(item => {
          const verificacao = verificacoesMapeamento[`${order.id}-${item.sku}`];
          return verificacao && !(verificacao as any).mapeado;
        });
        
        if (temMapeamentoPendente) {
          return (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
          );
        }
        
        return (
          <Badge variant="default" className="text-xs bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            OK
          </Badge>
        );
        
      case 'numero_ecommerce':
        return <span className={baseClasses}>{order.numero_ecommerce || '-'}</span>;
        
      case 'numero_venda':
        return <span className={baseClasses}>{order.numero_venda || '-'}</span>;
        
      case 'empresa':
        return <span className={baseClasses}>{order.empresa || '-'}</span>;
        
      case 'forma_entrega':
        return <span className={baseClasses}>{order.forma_entrega || '-'}</span>;
        
      case 'is_fulfillment':
        return (
          <Badge variant={order.is_fulfillment ? "default" : "secondary"} className="text-xs">
            {order.is_fulfillment ? 'Sim' : 'Não'}
          </Badge>
        );
        
      case 'codigo_rastreamento':
        return order.codigo_rastreamento ? (
          <div className={baseClasses}>
            <code className="text-xs bg-muted px-1 rounded">
              {order.codigo_rastreamento}
            </code>
          </div>
        ) : <span className={baseClasses}>-</span>;
        
      case 'url_rastreamento':
        return order.url_rastreamento ? (
          <a
            href={order.url_rastreamento}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-xs"
          >
            Rastrear
          </a>
        ) : <span className={baseClasses}>-</span>;
        
      case 'data_prevista':
        return <span className={baseClasses}>
          {order.data_prevista ? formatDate(order.data_prevista) : '-'}
        </span>;
        
      case 'status_detalhado':
        return <span className={baseClasses}>{order.status_detail || '-'}</span>;
        
      case 'substatus':
        return <span className={baseClasses}>{order.substatus || '-'}</span>;
        
      case 'substatus_detail':
        const substatusText = mapMLShippingSubstatus(order.substatus_detail || '');
        return <span className={baseClasses}>{substatusText}</span>;
        
      case 'shipping_mode':
        return <span className={baseClasses}>{order.shipping_mode || '-'}</span>;
        
      case 'shipping_method':
        return <span className={baseClasses}>{order.shipping_method || '-'}</span>;
        
      case 'status_pagamento':
        return <span className={baseClasses}>{order.status_payment || '-'}</span>;
        
      case 'status_envio':
        return <span className={baseClasses}>{order.status_shipping || '-'}</span>;
        
      case 'cidade':
        return <span className={baseClasses}>{order.cidade || '-'}</span>;
        
      case 'uf':
        return <span className={baseClasses}>{order.uf || '-'}</span>;
        
      case 'cpf_cnpj':
        return <span className={baseClasses}>
          {order.cpf_cnpj ? maskCpfCnpj(order.cpf_cnpj) : '-'}
        </span>;
        
      case 'id':
        return <span className={`${baseClasses} font-mono text-xs`}>{order.id}</span>;
        
      case 'created_at':
        return <span className={baseClasses}>
          {order.created_at ? formatDate(order.created_at) : '-'}
        </span>;
        
      case 'obs':
        return <span className={baseClasses}>{order.obs || '-'}</span>;
        
      case 'obs_interna':
        return <span className={baseClasses}>{order.obs_interna || '-'}</span>;

      // Debug - nomes originais da API
      case 'raw_total_amount':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.total_amount || 'null'}
          </span>
        );
        
      case 'raw_paid_amount':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.paid_amount || 'null'}
          </span>
        );
        
      case 'raw_shipping_cost':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.shipping_cost || 'null'}
          </span>
        );
        
      case 'raw_shipping_payments_total':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.raw_shipping_payments_total || 'null'}
          </span>
        );
        
      case 'raw_shipping_costs_gross_amount':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.raw_shipping_costs_gross_amount || 'null'}
          </span>
        );
        
      case 'raw_shipping_costs_receiver_cost':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.raw_shipping_costs_receiver_cost || 'null'}
          </span>
        );
        
      case 'raw_shipping_costs_senders_comp_total':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.raw_shipping_costs_senders_comp_total || 'null'}
          </span>
        );
        
      case 'raw_shipping_bonus_total':
        return (
          <span className={`${baseClasses} font-mono text-red-600`}>
            {order.bonus_total || 'null'}
          </span>
        );
        
      case 'raw_fonte':
        return (
          <span className={`${baseClasses} font-mono text-purple-600`}>
            {order.raw_fonte || state.fonte || 'unknown'}
          </span>
        );
        
      default:
        return <span className={baseClasses}>-</span>;
    }
  };

  const handleSelecionarTodos = () => {
    if (selectedPedidos.size === paginatedOrders.length) {
      setSelectedPedidos(new Set());
    } else {
      setSelectedPedidos(new Set(paginatedOrders.map(p => p.id)));
    }
  };

  const handleSelecionarPedido = (id: string) => {
    const novaSeleção = new Set(selectedPedidos);
    if (novaSeleção.has(id)) {
      novaSeleção.delete(id);
    } else {
      novaSeleção.add(id);
    }
    setSelectedPedidos(novaSeleção);
  };

  const handleBaixaEstoque = async (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowBaixaModal(true);
  };

  // ============= RENDER =============
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 🛡️ CABEÇALHO SIMPLES E FUNCIONAL */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
              <p className="text-muted-foreground">
                Gerencie seus pedidos de forma simples e eficiente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedPedidos.size > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowExportModal(true)}>
                Exportar Selecionados ({selectedPedidos.size})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={actions.refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant={multiSelectMode ? "default" : "outline"}
              onClick={() => {
                setMultiSelectMode(!multiSelectMode);
                if (multiSelectMode) {
                  setSelectedPedidos(new Set());
                }
              }}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {multiSelectMode ? 'Sair Seleção' : 'Selecionar'}
            </Button>
          </div>
        </div>

        {/* Indicadores de Status da Sincronização */}
        {state.isRefreshing && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Sincronizando pedidos... Por favor, aguarde.
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* 🛡️ FILTROS SIMPLES E FUNCIONAIS */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filtros</h3>
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Status do Envio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Envio</label>
              <Select 
                value={Array.isArray(filters.situacao) ? filters.situacao[0] || 'all' : filters.situacao || 'all'} 
                onValueChange={(value) => actions.setFilters({ situacao: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="ready_to_ship">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      Pronto para Envio
                    </div>
                  </SelectItem>
                  <SelectItem value="shipped">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                      Enviado
                    </div>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      Entregue
                    </div>
                  </SelectItem>
                  <SelectItem value="not_delivered">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      Não Entregue
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      Cancelado
                    </div>
                  </SelectItem>
                  <SelectItem value="handling">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                      Processando
                    </div>
                  </SelectItem>
                  <SelectItem value="to_be_agreed">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                      A Combinar
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataInicio ? (
                      format(filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataInicio}
                    onSelect={(date) => actions.setFilters({ dataInicio: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dataFim ? (
                      format(filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dataFim}
                    onSelect={(date) => actions.setFilters({ dataFim: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Controle de Colunas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colunas</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Selecionar Colunas</h4>
                      <Button size="sm" variant="ghost" onClick={resetToDefault}>
                        Padrão
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                       {['basic', 'products', 'financial', 'status', 'mapping', 'ml', 'shipping', 'address', 'buyer', 'ids', 'debug'].map((category) => {
                         const categoryColumns = allColumns.filter(col => col.category === category);
                         const categoryLabels = {
                           basic: 'Básicas',
                           products: 'Produtos',
                           financial: 'Financeiras', 
                           status: 'Status',
                           mapping: 'Mapeamento',
                           ml: 'Mercado Livre',
                           shipping: 'Envio',
                           address: 'Endereço',
                           buyer: 'Comprador',
                           ids: 'Identificação',
                           debug: 'Debug Financeiro (API)'
                         } as const;
                         
                         if (categoryColumns.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h5 className="text-sm font-medium text-muted-foreground border-b pb-1">
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </h5>
                            <div className="grid grid-cols-1 gap-1 ml-2">
                              {categoryColumns.map((col) => (
                                <label key={col.key} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={visibleColumns.has(col.key)}
                                    onCheckedChange={() => toggleColumn(col.key)}
                                  />
                                  <span>{col.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </Card>

      {/* Indicadores */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Fonte: {state.fonte} | Total: {total} pedidos</span>
          <Button
            size="sm"
            variant={debugFinanceiro ? 'default' : 'outline'}
            onClick={() => setDebugFinanceiro(v => !v)}
          >
            {debugFinanceiro ? 'Modo Diagnóstico: ON' : 'Modo Diagnóstico: OFF'}
          </Button>
          {state.isRefreshing && <span className="ml-2 animate-pulse">• Atualizando...</span>}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              console.log('[DEBUG] === FORÇANDO ATUALIZAÇÃO COMPLETA ===');
              console.log('[DEBUG] Total de pedidos:', orders.length);
              
              // Debug: Sample das primeiras orders
              if (orders.length > 0) {
                console.log('[DEBUG] Sample order data:', {
                  id: orders[0].id,
                  shipping_mode: orders[0].shipping_mode,
                  forma_entrega: orders[0].forma_entrega,
                  is_fulfillment: orders[0].is_fulfillment,
                  status_detail: orders[0].status_detail,
                  available_fields: Object.keys(orders[0])
                });
              }
              
              // Limpar todos os caches
              localStorage.clear();
              sessionStorage.clear();
              
              // Recarregar dados
              actions.clearFilters();
              actions.refetch();
              
              setTimeout(() => {
                console.log('[DEBUG] Página recarregando para garantir dados frescos...');
                window.location.reload();
              }, 1000);
            }}
            className="text-xs h-6 px-2"
          >
            🔄 Debug & Recarregar
          </Button>
        </div>
        {(filters.situacao || filters.dataInicio || filters.dataFim) && (
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              Filtros ativos
            </Badge>
          </div>
        )}
      </div>

      {/* 🛡️ MENSAGEM DE ERRO SEGURA */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">
            ⚠️ {error}
          </p>
        </Card>
      )}

      {/* 🚀 FASE 2: Loading otimizado */}
      <Card>
        {loading && !state.isRefreshing ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : !paginatedOrders?.length ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou verificar a conectividade.
            </p>
            <Button variant="outline" onClick={actions.refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {multiSelectMode && (
                    <th className="text-left p-4 w-12">
                      <Checkbox
                        checked={selectedPedidos.size === paginatedOrders.length && paginatedOrders.length > 0}
                        onCheckedChange={handleSelecionarTodos}
                      />
                    </th>
                  )}
                  {Array.from(visibleColumns).map(columnKey => {
                    const column = allColumns.find(col => col.key === columnKey);
                    return column ? (
                      <th key={columnKey} className="text-left p-4 font-medium">
                        {column.label}
                      </th>
                    ) : null;
                  })}
                  <th className="text-left p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    {multiSelectMode && (
                      <td className="p-4">
                        <Checkbox
                          checked={selectedPedidos.has(order.id)}
                          onCheckedChange={() => handleSelecionarPedido(order.id)}
                        />
                      </td>
                    )}
                    {Array.from(visibleColumns).map(columnKey => (
                      <td key={columnKey} className="p-4">
                        {renderCell(order, columnKey)}
                      </td>
                    ))}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBaixaEstoque(order as Pedido)}
                          disabled={processingBaixa.has(order.id)}
                          className="text-xs"
                        >
                          {processingBaixa.has(order.id) ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Processando
                            </>
                          ) : (
                            <>
                              <Package className="h-3 w-3 mr-1" />
                              Baixa
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 🚀 PAGINAÇÃO SIMPLES E EFICIENTE */}
      {paginatedOrders?.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} ({total} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL DE BAIXA - Temporariamente desabilitado */}
      {showBaixaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg">
            <p>Modal de baixa será implementado</p>
            <Button onClick={() => setShowBaixaModal(false)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}