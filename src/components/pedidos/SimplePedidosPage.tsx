/**
 * 🛡️ SISTEMA BLINDADO ATIVO - PEDIDOS PÁGINA PROTEGIDA
 * PROTEÇÃO: Pedidos ↔ Estoque ↔ Histórico ↔ De-Para
 * VALIDAÇÕES: SKU Kit + Total Itens + Anti-Duplicação + RLS
 * FLUXOS: SimplePedidosPage → BaixaEstoqueModal → baixar_estoque_direto → hv_insert
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatMoney, formatDate, maskCpfCnpj } from '@/lib/format';
import { formatPt, formatSubstatus, formatLogisticType, formatShippingStatus } from '@/utils/orderFormatters';
import { translateMLTags } from '@/lib/translations';
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, AlertCircle, Clock, Filter, Settings, CheckSquare, CalendarIcon, Search, Database } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { mapMLShippingSubstatus, ML_SHIPPING_SUBSTATUS_MAP, getStatusBadgeVariant as getMLStatusBadgeVariant } from '@/utils/mlStatusMapping';
import { listPedidos } from '@/services/pedidos';
import { mapApiStatusToLabel, getStatusBadgeVariant, mapSituacaoToApiStatus, statusMatchesFilter } from '@/utils/statusMapping';
import { usePedidosManager } from '@/hooks/usePedidosManager';
import { ExportModal } from './ExportModal';
import { SavedFiltersManager } from './SavedFiltersManager';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePedidosProcessados } from '@/hooks/usePedidosProcessados';
import { buildIdUnico } from '@/utils/idUnico';
import { 
  getShippingStatusColor, 
  translateShippingStatus, 
  translateShippingSubstatus, 
  translateShippingMode, 
  translateShippingMethod 
} from '@/utils/pedidos-translations';
import { usePersistentPedidosState } from '@/hooks/usePersistentPedidosState';

// ✅ SISTEMA UNIFICADO DE FILTROS
import { usePedidosFiltersUnified } from '@/hooks/usePedidosFiltersUnified';
import { PedidosFiltersUnified } from './PedidosFiltersUnified';
import { StatusFilters } from '@/features/orders/types/orders-status.types';

import { useColumnManager, resetColumnCache } from '@/features/pedidos/hooks/useColumnManager';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import { PedidosTableSection } from './components/PedidosTableSection';
import { PedidosDashboardSection } from './components/PedidosDashboardSection';
import { PedidosHeaderSection } from './components/PedidosHeaderSection';
import { PedidosBulkActionsSection } from './components/PedidosBulkActionsSection';
import { PedidosModalsSection } from './components/PedidosModalsSection';
import { PedidosStatusBar } from './components/PedidosStatusBar';
import { PedidosStickyActions } from './components/PedidosStickyActions';
import { usePedidosMappingsOptimized } from './hooks/usePedidosMappingsOptimized';
import StatusDebugPanel from './StatusDebugPanel';
import { usePedidosAggregator } from '@/hooks/usePedidosAggregator';
import { MobilePedidosPage } from './MobilePedidosPage';
import { useIsMobile } from '@/hooks/use-mobile';
import { MapeamentoModal } from './MapeamentoModal';

import { DevolucoesMercadoLivreTab } from './devolucoes/DevolucoesMercadoLivreTab';
import { FEATURES } from '@/config/features';
import { ProviderSelector } from './components/ProviderSelector';

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
  integration_account_id: string;
  created_at: string;
  updated_at: string;
  skus?: string[];
  raw?: any;
  unified?: any;
  [key: string]: any;
};

type Props = {
  className?: string;
};

function SimplePedidosPage({ className }: Props) {
  const isMobile = useIsMobile();
  
  
  // ✅ CORREÇÃO CRÍTICA: Limpar filtros problemáticos do localStorage e cache de colunas
  useEffect(() => {
    try {
      // Limpar localStorage com filtros corrompidos/problemáticos
      const keys = ['pedidos_unified_filters', 'pedidos_persistent_state', 'pedidos-saved-filters'];
      keys.forEach(key => {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          // ✅ CORREÇÃO: Status de envio removido - apenas limpar localStorage antigo
          if (parsed.statusEnvio?.length > 0 || parsed.filters?.statusEnvio?.length > 0) {
            console.log('🗑️ Removendo filtros de status de envio antigos:', key, parsed);
            localStorage.removeItem(key);
          }
        }
      });
      
      // ✅ FORÇAR ATUALIZAÇÃO: Limpar cache de colunas para reconhecer novas colunas avançadas
      const columnCacheKeys = ['pedidos-column-preferences', 'pedidos:lastSearch'];
      const hasOldColumns = columnCacheKeys.some(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            // Verificar se não tem as novas colunas avançadas
            const visibleColumns = parsed.visibleColumns || {};
            const hasAdvancedColumns = ['order_status_advanced', 'shipping_status_advanced'].some(col => 
              Array.isArray(visibleColumns) ? visibleColumns.includes(col) : visibleColumns[col]
            );
            return !hasAdvancedColumns; // Se não tem, precisa limpar
          } catch {
            return true; // Se erro, limpar
          }
        }
        return false;
      });
      
      if (hasOldColumns) {
        console.log('🔄 Limpando cache de colunas para incluir colunas avançadas...');
        columnCacheKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Erro ao limpar filtros problemáticos:', error);
    }
  }, []);
  
  // 🔄 PERSISTÊNCIA DE ESTADO - Manter filtros e dados ao sair/voltar da página
  const persistentState = usePersistentPedidosState();
  
  // Estado dos filtros avançados
  const [useAdvancedStatus, setUseAdvancedStatus] = useState(false);
  const [advancedStatusFilters, setAdvancedStatusFilters] = useState<StatusFilters>({
    orderStatus: [],
    shippingStatus: [],
    shippingSubstatus: [],
    returnStatus: []
  });

  // ✅ SISTEMA UNIFICADO DE FILTROS - UX CONSISTENTE + REFETCH AUTOMÁTICO
  const filtersManager = usePedidosFiltersUnified({
    onFiltersApply: async (filters) => {
      console.groupCollapsed('[filters/apply]');
      console.log('draft', filters);
      console.groupEnd();
      
      // Limpar estado persistido ao aplicar novos filtros
      persistentState.clearPersistedState();
      
      // ✅ Aplicar filtros (fonte única: appliedFilters no manager) e buscar imediatamente
      actions.replaceFilters(filters);
      
      console.groupCollapsed('[apply/callback]');
      console.log('filtersArg', filters);
      console.log('filtersManager.appliedFilters', filtersManager.appliedFilters);
      console.assert(
        JSON.stringify(filters) === JSON.stringify(filtersManager.filters),
        'apply: filtros divergentes entre UI e callback'
      );
      console.groupEnd();
      
      // Salvar os filtros aplicados
      persistentState.saveAppliedFilters(filters);
    },
    autoLoad: false,
    loadSavedFilters: false
  });

  // Handlers para filtros avançados
  const handleAdvancedStatusFiltersChange = useCallback((filters: StatusFilters) => {
    setAdvancedStatusFilters(filters);
  }, []);

  const handleResetAdvancedStatusFilters = useCallback(() => {
    setAdvancedStatusFilters({
      orderStatus: [],
      shippingStatus: [],
      shippingSubstatus: [],
      returnStatus: []
    });
  }, []);
  
  // Estado unificado dos pedidos
  const pedidosManager = usePedidosManager();
  const { state, actions, totalPages } = pedidosManager;
  
  // ✅ CRÍTICO: Listener para mudanças de filtros aplicados 
  useEffect(() => {
    // Quando appliedFilters mudar e não for vazio, force refetch
    if (filtersManager.appliedFilters && Object.keys(filtersManager.appliedFilters).length > 0) {
      console.log('🔄 [FILTERS SYNC] Filtros aplicados mudaram, sincronizando...', filtersManager.appliedFilters);
    }
  }, [filtersManager.appliedFilters]);
  
  // 🔧 Sistema de colunas unificado com persistência automatica
  const columnManager = useColumnManager();
  const visibleColumns = columnManager.state.visibleColumns;
  
  
  
  // Estados locais para funcionalidades específicas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  
  // ✅ FASE 3: Estado para seleção de provider (Shopee + ML)
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  
  // 🔗 Estado do modal de mapeamento
  const [showMapeamentoModal, setShowMapeamentoModal] = useState(false);
  const [pedidoParaMapeamento, setPedidoParaMapeamento] = useState<any>(null);
  
  // 🧠 Hook de mapeamentos otimizado - CORREÇÃO DE PERFORMANCE
  const {
    mappingData,
    isProcessingMappings,
    processingStats,
    cacheStats,
    actions: mappingActions
  } = usePedidosMappingsOptimized({
    enabled: true,
    autoProcess: true,
    debounceMs: 800, // ✅ Debounce maior para evitar múltiplas execuções
    onMappingUpdate: (mappings) => {
      // Callback silencioso para performance
    }
  });
  
  // Hook para verificar pedidos já processados
  const { pedidosProcessados, verificarPedidos, isLoading: loadingProcessados, isPedidoProcessado } = usePedidosProcessados();

  // ✅ Função para calcular estatísticas das contas ML baseado nos erros do console
  const getAccountsStats = useCallback(() => {
    if (!accounts || accounts.length === 0) {
      return { total: 0, successful: 0, failed: 0, successfulAccounts: [], failedAccounts: [] };
    }

    const total = accounts.length;
    // Por agora assumir que todas falharam baseado nos logs de erro
    const failed = total;
    const successful = 0;
    
    const successfulAccounts: string[] = [];
    const failedAccounts = accounts.map(acc => acc.id);

    return { total, successful, failed, successfulAccounts, failedAccounts };
  }, [accounts]);
  
  // Aliases para compatibilidade
  const orders = state.orders;
  const total = state.total;
  const loading = state.loading;
  const error = state.error;
  const currentPage = state.currentPage;
  const integrationAccountId = state.integrationAccountId;
  
  // Hook para contadores agregados (totais globais para os cards)
  const { counts: globalCounts, loading: loadingCounts } = usePedidosAggregator(
    integrationAccountId,
    filtersManager.appliedFilters
  );
  
  // Filtro rápido (apenas client-side) - COM PERSISTÊNCIA
  const [quickFilter, setQuickFilter] = useState<'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 'delivered'>(() => {
    return persistentState.persistedState?.quickFilter as any || 'all';
  });

  // Lista exibida considerando o filtro rápido (não altera filtros da busca)
  const displayedOrders = useMemo(() => {
    if (!orders || quickFilter === 'all') return orders;
    return orders.filter((order: any) => {
      const id = order?.id || order?.numero || order?.unified?.id;
      const mapping = (mappingData as any)?.get?.(id);
      const statuses = [
        order?.shipping_status,
        order?.shipping?.status,
        order?.unified?.shipping?.status,
        order?.situacao,
        order?.status
      ].filter(Boolean).map((s: any) => String(s).toLowerCase());
      switch (quickFilter) {
        case 'pronto_baixar': {
          const temMapeamentoCompleto = !!(mapping && (mapping.skuEstoque || mapping.skuKit));
          const baixado = isPedidoProcessado(order);
          return temMapeamentoCompleto && !baixado;
        }
        case 'mapear_incompleto': {
          const temIncompleto = !!(mapping && mapping.temMapeamento && !(mapping.skuEstoque || mapping.skuKit));
          const baixado = isPedidoProcessado(order);
          return temIncompleto && !baixado;
        }
        case 'baixado':
          return !!isPedidoProcessado(order) || String(order?.status_baixa || '').toLowerCase().includes('baixado');
        case 'shipped':
          return statuses.some((s: string) => s.includes('shipped') || s.includes('ready_to_ship'));
        case 'delivered':
          return statuses.some((s: string) => s.includes('delivered'));
        default:
          return true;
      }
    });
  }, [orders, quickFilter, mappingData, isPedidoProcessado]);

  // ✅ MIGRAÇÃO FASE 1: Funções de tradução movidas para @/utils/pedidos-translations

  // ✅ MIGRAÇÃO: Usar traduções unificadas do sistema global

  // 🔄 RESTAURAR ESTADO PERSISTIDO ao carregar a página
  useEffect(() => {
    if (persistentState.isStateLoaded && persistentState.hasValidPersistedState()) {
      const persistedData = persistentState.persistedState!;
      
      console.log('🔄 Restaurando estado persistido:', {
        filters: persistedData.filters,
        ordersCount: persistedData.orders.length,
        page: persistedData.currentPage
      });
      
      // Restaurar filtros no manager (sem refetch automático)
      if (persistedData.filters && Object.keys(persistedData.filters).length > 0) {
        // Garantir que as datas sejam objetos Date válidos
        const filters = { ...persistedData.filters };
        if (filters.dataInicio && typeof filters.dataInicio === 'string') {
          filters.dataInicio = new Date(filters.dataInicio);
        }
        if (filters.dataFim && typeof filters.dataFim === 'string') {
          filters.dataFim = new Date(filters.dataFim);
        }
        
        filtersManager.updateFilter('search', filters.search);
        filtersManager.updateFilter('dataInicio', filters.dataInicio);
        filtersManager.updateFilter('dataFim', filters.dataFim);
        filtersManager.updateFilter('contasML', filters.contasML);
        
        // Aplicar filtros sem refetch (os dados já estão em cache)
        actions.replaceFilters(filters);
      }
      
      // Restaurar dados através do manager de pedidos
      actions.restorePersistedData(persistedData.orders, persistedData.total, persistedData.currentPage);
      
      if (persistedData.integrationAccountId) {
        actions.setIntegrationAccountId(persistedData.integrationAccountId);
      }
    }
  }, [persistentState.isStateLoaded]);
  
  // 🔄 SALVAR DADOS quando eles mudarem (após busca)
  useEffect(() => {
    if (orders && orders.length > 0 && !loading) {
      persistentState.saveOrdersData(orders, total, currentPage);
    }
  }, [orders, total, currentPage, loading]);
  
  // 🔄 SALVAR FILTRO RÁPIDO quando mudar
  const handleQuickFilterChange = useCallback((newFilter: typeof quickFilter) => {
    setQuickFilter(newFilter);
    persistentState.saveQuickFilter(newFilter);
    
    // Forçar refresh dos dados para recalcular totais
    setTimeout(() => {
      actions.refetch();
    }, 100);
  }, [actions]);
  
  useEffect(() => {
    if (quickFilter !== 'all') {
      persistentState.saveQuickFilter(quickFilter);
    }
  }, [quickFilter]);
  
  // ✅ CORREÇÃO: Processar mapeamentos sempre que houver pedidos carregados
  useEffect(() => {
    if (orders && orders.length > 0) {
      
      verificarPedidos(orders);
      // ✅ Usar a função correta que processa diretamente
      mappingActions.processOrdersMappings(orders);
    }
  }, [orders, verificarPedidos]); // ✅ Dependência simplificada mas funcional
  
  // 🔗 Listener para abrir modal de mapeamento
  useEffect(() => {
    const handleOpenMapeamentoModal = (event: any) => {
      const { pedido } = event.detail;
      setPedidoParaMapeamento(pedido);
      setShowMapeamentoModal(true);
    };

    window.addEventListener('openMapeamentoModal', handleOpenMapeamentoModal);
    
    return () => {
      window.removeEventListener('openMapeamentoModal', handleOpenMapeamentoModal);
    };
  }, []);
  
  // Helpers financeiros: receita_por_envio (Flex) e valor_liquido_vendedor
  const getReceitaPorEnvio = (order: any): number => {
    // Se já vier calculado do backend, usar
    if (typeof order?.receita_por_envio === 'number') return order.receita_por_envio;

    // Detectar o tipo logístico a partir de múltiplas fontes (como a tabela exibe)
    const rawType =
      order?.shipping?.logistic?.type ??
      order?.raw?.shipping?.logistic?.type ??
      order?.logistic_type ??
      order?.shipping_details?.logistic_type ??
      order?.unified?.logistic?.type ??
      order?.logistic?.type;

    const logisticType = String(rawType || '').toLowerCase().replace(/\s+/g, '_');
    // Receita com envio só existe no Flex (self_service)
    if (logisticType !== 'self_service' && logisticType !== 'flex') return 0;

    // 0) Se o backend já calculou (shipping.bonus_total/bonus), priorizar
    const shippingBonus = Number(
      order?.shipping?.bonus_total ??
      order?.shipping?.bonus ??
      order?.unified?.shipping?.bonus_total ??
      order?.unified?.shipping?.bonus ?? 0
    );
    if (Number.isFinite(shippingBonus) && shippingBonus > 0) return shippingBonus;

    // 1) Bônus por envio via /shipments/{id}/costs -> senders[].compensation e senders[].compensations[].amount
    const costs =
      order?.shipping?.costs ||
      order?.raw?.shipping?.costs ||
      order?.unified?.shipping?.costs;

    let compTotal = 0;
    if (costs?.senders && Array.isArray(costs.senders)) {
      compTotal = costs.senders.reduce((acc: number, s: any) => {
        const direct = Number(s?.compensation ?? 0);
        const nestedList = Array.isArray(s?.compensations) ? s.compensations : [];
        const nestedSum = nestedList.reduce((a: number, c: any) => a + (Number(c?.amount ?? 0) || 0), 0);
        return acc + (Number.isFinite(direct) ? direct : 0) + nestedSum;
      }, 0);
    }

    if (compTotal > 0) return compTotal;

    // 2) Pagamentos do envio (fallback legado apenas se /costs não disponível)
    let paymentsTotal = 0;
    const shippingPaymentArrays = [
      order?.shipping?.payments,
      order?.raw?.shipping?.payments,
      order?.unified?.shipping?.payments,
      order?.shipping_payments,
      order?.unified?.shipping_payments,
      order?.raw?.shipping_payments,
    ].filter(Boolean);
    for (const arr of shippingPaymentArrays) {
      if (Array.isArray(arr)) {
        for (const p of arr) {
          const status = String(p?.status || '').toLowerCase();
          if (status && status !== 'approved') continue;
          const amt = Number(p?.amount ?? p?.value ?? p?.cost ?? 0);
          if (!Number.isNaN(amt) && amt > 0) paymentsTotal += amt;
        }
      }
    }

    if (paymentsTotal > 0) return paymentsTotal; // fallback legado

    // 3) Outros campos eventuais
    const flexBonusFields = [
      order?.shipping_bonus,
      order?.envio_bonus,
      order?.flex_bonus,
      order?.shipping?.bonus,
      order?.raw?.shipping?.bonus,
      order?.shipping?.lead_time?.bonus,
      order?.raw?.shipping?.lead_time?.bonus,
    ].filter(val => val !== undefined && val !== null);

    for (const bonus of flexBonusFields) {
      const amt = Number(bonus);
      if (!Number.isNaN(amt) && amt > 0) {
        return amt;
      }
    }

    return 0;
  };
  
  const getValorLiquidoVendedor = (order: any): number => {
    if (typeof order?.valor_liquido_vendedor === 'number') return order.valor_liquido_vendedor;

    // ✅ USANDO CAMPOS DIRETOS DA API DO ML
    // 1. Verificar se há campo direto de compensação do vendedor nos shipping costs
    const sellerCompensation = order?.shipping?.costs?.senders?.[0]?.compensation || 
                               order?.raw?.shipping?.costs?.senders?.[0]?.compensation || 0;
    
    if (sellerCompensation > 0) {
      return sellerCompensation;
    }
    
    // 2. Verificar se há valor líquido nos payments (transaction_amount - marketplace_fee)
    const payments = order?.payments || order?.raw?.payments || [];
    if (Array.isArray(payments) && payments.length > 0) {
      const payment = payments[0];
      const transactionAmount = Number(payment?.transaction_amount || 0);
      const marketplaceFee = Number(payment?.marketplace_fee || 0);
      
      if (transactionAmount > 0) {
        return Math.max(0, transactionAmount - marketplaceFee);
      }
    }
    
    // 3. Fallback para cálculo manual usando API fields
    const valorTotal = Number(order?.total_amount ?? order?.valor_total ?? 0);
    const taxaMarketplace = Number(order?.order_items?.[0]?.sale_fee ?? 
                                  order?.raw?.order_items?.[0]?.sale_fee ?? 
                                  order?.marketplace_fee ?? 0);
    
    return Math.max(0, valorTotal - taxaMarketplace);
  };

  // Configuração de colunas (reposta após ajuste)
  type ColumnDef = { key: string; label: string; default: boolean; category?: string };
  const allColumns: ColumnDef[] = [
    // Básicas
    { key: 'id', label: 'ID-Único', default: true, category: 'basic' },
    { key: 'empresa', label: 'Empresa', default: true, category: 'basic' },
    { key: 'numero', label: 'Número do Pedido', default: true, category: 'basic' },
    { key: 'nome_cliente', label: 'Nome do Cliente', default: true, category: 'basic' },
    { key: 'nome_completo', label: 'Nome Completo', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data do Pedido', default: true, category: 'basic' },
    { key: 'last_updated', label: 'Última Atualização', default: false, category: 'basic' },

    // Produtos
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade_itens', label: 'Quantidade Total', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título do Produto', default: true, category: 'products' },

    // Financeiro - CAMPOS SEPARADOS E EXCLUSIVOS
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    { key: 'paid_amount', label: 'Valor Pago', default: true, category: 'financial' },
    { key: 'frete_pago_cliente', label: 'Frete Pago Cliente', default: true, category: 'financial' },
    { key: 'receita_flex', label: 'Receita Flex (Bônus)', default: true, category: 'financial' },
    { key: 'custo_envio_seller', label: 'Custo Envio Seller', default: false, category: 'financial' },
    { key: 'coupon_amount', label: 'Desconto Cupom', default: false, category: 'financial' },
    { key: 'marketplace_fee', label: 'Taxa Marketplace', default: true, category: 'financial' },
    { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', default: true, category: 'financial' },
    { key: 'payment_method', label: 'Método Pagamento', default: false, category: 'financial' },
    { key: 'payment_status', label: 'Status Pagamento', default: false, category: 'financial' },
    { key: 'payment_type', label: 'Tipo Pagamento', default: false, category: 'financial' },

    // Mapeamento  
    { key: 'cpf_cnpj', label: 'CPF/CNPJ', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT', default: false, category: 'mapping' },
    { key: 'qtd_kit', label: 'Quantidade KIT', default: false, category: 'mapping' },
    { key: 'total_itens', label: 'Total de Itens', default: true, category: 'mapping' },
    { key: 'status_baixa', label: 'Status da Baixa', default: true, category: 'mapping' },
    
    // Status
    { key: 'situacao', label: 'Status do Pagamento', default: true, category: 'shipping' },

    // Metadados ML
    { key: 'date_created', label: 'Data Criação ML', default: false, category: 'meta' },
    { key: 'pack_id', label: 'Pack ID', default: false, category: 'meta' },
    { key: 'pickup_id', label: 'Pickup ID', default: false, category: 'meta' },
    { key: 'tags', label: 'Tags', default: false, category: 'meta' },

    // Envio (combinado)
    { key: 'shipping_status', label: 'Status do Envio', default: true, category: 'shipping' },
    { key: 'logistic_mode', label: 'Logistic Mode (Principal)', default: false, category: 'shipping' },
    { key: 'logistic_type', label: 'Tipo Logístico', default: false, category: 'shipping' },
    { key: 'shipping_method_type', label: 'Tipo Método Envio', default: false, category: 'shipping' },
    
    { key: 'substatus_detail', label: 'Substatus (Estado Atual)', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio (Combinado)', default: false, category: 'shipping' },
    { key: 'shipping_method', label: 'Método de Envio (Combinado)', default: false, category: 'shipping' },
    
    // Endereço
    { key: 'endereco_rua', label: 'Rua', default: false, category: 'shipping' },
    { key: 'endereco_numero', label: 'Número', default: false, category: 'shipping' },
    { key: 'endereco_bairro', label: 'Bairro', default: false, category: 'shipping' },
    { key: 'endereco_cep', label: 'CEP', default: false, category: 'shipping' },
    { key: 'endereco_cidade', label: 'Cidade', default: false, category: 'shipping' },
    { key: 'endereco_uf', label: 'UF', default: false, category: 'shipping' },
  ];

  // ✅ Sistema de colunas removido - agora usa useColumnManager com persistência automática
  
  const toggleColumn = (key: string) => {
    columnManager.actions.toggleColumn(key);
  };

  const resetToDefault = () => {
    columnManager.actions.resetToDefault();
  };

  // Status da baixa usando sistema centralizado
  const renderStatusBaixa = (pedidoId: string) => {
    const mapping = mappingData.get(pedidoId);
    if (!mapping) return <span className="text-muted-foreground">-</span>;

    // ✅ CORRIGIDO: Usar valor fixo por enquanto
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Sem mapear</span>
      </div>
    );
  };

  // 🛡️ FUNÇÃO SIMPLIFICADA - usa sistema centralizado
  const simplificarStatus = (status: string): string => {
    return mapApiStatusToLabel(status);
  };

  // ✅ REMOVIDO: Usar formatadores centralizados do orderFormatters

  // ✅ REMOVIDO: Usar formatLogisticType do orderFormatters

  // ✅ REMOVIDO: Usar formatSubstatus do orderFormatters

  // Helper para testar contas - COM DEBUG DETALHADO
  const testAccount = async (accId: string) => {
    console.log(`🔍 DEBUG: Testando conta ${accId}...`);
    try {
      const { data, error } = await supabase.functions.invoke('unified-orders', {
        body: { integration_account_id: accId, limit: 1 }
      });
      
      console.log(`🔍 DEBUG: unified-orders response para ${accId}:`, {
        hasData: !!data,
        hasError: !!error,
        dataOk: data?.ok,
        errorMsg: error?.message,
        dataError: data?.error,
        status: data?.status
      });
      
      if (error) {
        console.error(`🔍 DEBUG: Erro na conta ${accId}:`, error);
        return false;
      }
      
      if (!data?.ok) {
        console.warn(`🔍 DEBUG: Resposta não-ok para ${accId}:`, data);
        return false;
      }
      
      console.log(`✅ DEBUG: Conta ${accId} funcionando!`);
      return true;
    } catch (e) {
      console.error(`🔍 DEBUG: Exceção na conta ${accId}:`, e);
      return false;
    }
  };

  // ✅ FASE 3: Carregamento de contas unificado (ML + Shopee) - SEM QUEBRAR SISTEMA EXISTENTE
  const loadAccounts = async () => {
    try {
      // 🛡️ SEGURANÇA: Garantir que ML sempre seja incluído
      const providers = ['mercadolivre'];
      
      // ✅ EXPANSÃO SEGURA: Adicionar Shopee apenas se feature estiver ativa
      if (FEATURES.SHOPEE) {
        providers.push('shopee');
      }

      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .in('provider', providers as ('mercadolivre' | 'shopee')[])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const list = data || [];
      setAccounts(list);
      console.log('📊 Contas carregadas (ML + Shopee):', {
        total: list.length,
        mercadolivre: list.filter(a => a.provider === 'mercadolivre').length,
        shopee: list.filter(a => a.provider === 'shopee').length,
        accounts: list
      });
    } catch (err: any) {
      console.error('Erro ao carregar contas:', err.message);
    }
  };

  // Handlers memoizados para performance
  const handleFilterChange = useCallback((newFilters: any) => {
    actions.setFilters(newFilters);
  }, [actions.setFilters]);

  const handleBaixaEstoque = async (pedidos: string[]) => {
    console.log('Iniciando baixa de estoque para:', pedidos);
    setShowBaixaModal(false);
    // Lógica de baixa de estoque aqui
  };

  // Definir conta via URL (?acc= ou ?integration_account_id=) — somente após carregar contas e validando
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const acc = sp.get('acc') || sp.get('integration_account_id');
      if (!acc) return;
      if (!Array.isArray(accounts) || accounts.length === 0) return; // aguarda contas

      const exists = accounts.some((a) => (a.id || a.account_id) === acc);
      const target = exists ? acc : (accounts[0]?.id as string) || (accounts[0]?.account_id as string);
      if (!target) return;

      console.log('[account/url] selecionando conta via URL (validada):', target);
      actions.setIntegrationAccountId(target);
      // Atualiza persistência para evitar reuso de ID inválido
      try {
        const saved = localStorage.getItem('pedidos:lastSearch');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.integrationAccountId = target;
          localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
        }
      } catch {}
    } catch {}
  }, [actions, accounts]);


  // Carregar contas na inicialização (sem qualquer desativação automática)
  useEffect(() => {
    loadAccounts();
  }, []);

// Selecionar conta somente se existir exatamente 1 conta ativa
useEffect(() => {
  if (!state.integrationAccountId && Array.isArray(accounts) && accounts.length === 1) {
    const onlyAcc = (accounts[0]?.id as string) || (accounts[0]?.account_id as string);
    if (onlyAcc) {
      console.log('[account/default] selecionando única conta ativa:', onlyAcc);
      actions.setIntegrationAccountId(onlyAcc);
    }
  }
}, [accounts, state.integrationAccountId, actions]);

// Se a conta selecionada não estiver mais ativa, substituir por uma válida (ou limpar)
useEffect(() => {
  if (
    state.integrationAccountId &&
    Array.isArray(accounts)
  ) {
    const isValid = accounts.some((a) => (a.id || a.account_id) === state.integrationAccountId);
    if (!isValid) {
      const fallback = (accounts[0]?.id as string) || (accounts[0]?.account_id as string) || '';
      if (fallback) {
        console.log('[account/reset] conta inválida, substituindo por primeira ativa:', fallback);
        actions.setIntegrationAccountId(fallback);
        try {
          const saved = localStorage.getItem('pedidos:lastSearch');
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.integrationAccountId = fallback;
            localStorage.setItem('pedidos:lastSearch', JSON.stringify(parsed));
          }
        } catch {}
      } else {
        console.log('[account/reset] nenhuma conta ativa encontrada, limpando seleção');
        actions.setIntegrationAccountId('');
        try { localStorage.removeItem('pedidos:lastSearch'); } catch {}
      }
    }
  }
}, [accounts, state.integrationAccountId, actions]);
  const validateSystem = () => {
    try {
      // Validações básicas do sistema (removido hardcoded IDs)
      const hasOrders = orders && orders.length > 0;
      
      if (!hasOrders) {
        console.log('ℹ️ Sistema: Nenhum pedido carregado ainda');
        return true; // Não é erro se não há pedidos
      }

      // ✅ CORREÇÃO: Verificação mais robusta de IDs
      const ordersWithoutId = orders.filter((o: any) => !o.id && !o.numero && !o.id_unico);
      const totalOrders = orders.length;
      const validOrders = totalOrders - ordersWithoutId.length;
      
      if (ordersWithoutId.length > 0) {
        console.warn(`⚠️ Sistema: ${ordersWithoutId.length}/${totalOrders} pedidos sem ID válido`, {
          exemplos: ordersWithoutId.slice(0, 3).map((o: any) => ({
            keys: Object.keys(o),
            hasRaw: !!o.raw,
            hasUnified: !!o.unified
          }))
        });
        
        // Se mais da metade tem ID válido, consideramos OK
        if (validOrders / totalOrders >= 0.5) {
          console.log(`✅ Sistema: ${validOrders}/${totalOrders} pedidos válidos (${Math.round(validOrders/totalOrders*100)}%)`);
          return true;
        }
        return false;
      }

      console.log(`✅ Sistema validado: ${totalOrders} pedidos válidos`);
      return true;
    } catch (error) {
      console.error('💥 Erro na validação do sistema:', error);
      return false;
    }
  };

  // Executar validação periodicamente
  useEffect(() => {
    const interval = setInterval(validateSystem, 5000);
    return () => clearInterval(interval);
  }, [orders, mappingData]);


  // Render principal
  return (
    <Tabs defaultValue="orders" className="h-screen flex flex-col">
      {/* Header com abas */}
      <div className="border-b bg-background sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            🛒
            /
            Pedidos
          </div>
        </div>
        
        <TabsList className="grid w-full grid-cols-2 max-w-lg">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            📦 Orders
          </TabsTrigger>
          <TabsTrigger value="devolucoes" className="flex items-center gap-2">
            🔄 Devoluções ML
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Conteúdo das abas */}
      <TabsContent value="orders" className="flex-1 overflow-auto m-0 p-6">
        <div className="space-y-6">
          {/* 📊 DASHBOARD INTELIGENTE */}
          <PedidosDashboardSection 
            orders={orders || []}
            loading={loading}
          />

      {/* 🛡️ HEADER BLINDADO */}
      <PedidosHeaderSection
        fonte={state.fonte}
        totalCount={total}
        loading={loading}
        isRefreshing={state.isRefreshing}
        onRefresh={actions.refetch}
        onApplyFilters={() => {
          console.groupCollapsed('[apply/click] from=header');
          console.log('draftFilters', filtersManager.filters);
          console.groupEnd();
          filtersManager.applyFilters();
        }}
        selectedOrdersCount={selectedOrders.size}
        hasPendingChanges={filtersManager.hasPendingChanges}
      >
      </PedidosHeaderSection>

      {/* ⚠️ Feedback sobre status das contas ML */}
      {state.loading && (
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg border mb-4">
          <p className="font-medium flex items-center gap-2">
            ⏳ Verificando contas conectadas e buscando pedidos...
          </p>
        </div>
      )}

      {/* ✅ Barra de resumo com contadores */}
      <PedidosStatusBar 
        orders={orders}
        quickFilter={quickFilter}
        onQuickFilterChange={(filter) => setQuickFilter(filter)}
        globalCounts={globalCounts}
      />

      {/* ✅ Ações sticky unificadas (substituindo componente antigo) */}
      <PedidosStickyActions
        orders={orders}
        displayedOrders={displayedOrders}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        mappingData={mappingData}
        isPedidoProcessado={isPedidoProcessado}
        quickFilter={quickFilter}
        onBaixaConcluida={() => {
          setSelectedOrders(new Set());
          actions.refetch();
        }}
      />


      {/* ✅ FASE 3: Seletor de Provider (Shopee + ML) */}
      {FEATURES.SHOPEE && accounts.length > 0 && (
        <ProviderSelector
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          accounts={accounts}
          loading={loading}
        />
      )}

      {/* ✅ NOVO SISTEMA DE FILTROS UNIFICADO - UX CONSISTENTE */}
      <PedidosFiltersUnified
        filters={filtersManager.filters}
        appliedFilters={filtersManager.appliedFilters}
        onFilterChange={filtersManager.updateFilter}
        onApplyFilters={filtersManager.applyFilters}
        onCancelChanges={filtersManager.cancelChanges}
        onClearFilters={filtersManager.clearFilters}
        hasPendingChanges={filtersManager.hasPendingChanges}
        needsManualApplication={filtersManager.needsManualApplication}
        isApplying={filtersManager.isApplying}
        columnManager={columnManager}
        activeFiltersCount={filtersManager.activeFiltersCount}
        contasML={accounts}
        useAdvancedStatus={useAdvancedStatus}
        onToggleAdvancedStatus={setUseAdvancedStatus}
        advancedStatusFilters={advancedStatusFilters}
        onAdvancedStatusFiltersChange={handleAdvancedStatusFiltersChange}
        onResetAdvancedStatusFilters={handleResetAdvancedStatusFilters}
      />
      
      {/* BACKUP - CÓDIGO ORIGINAL DOS FILTROS */}
      <Card className="p-4" style={{ display: 'none' }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Filtros</h3>
            <Button size="sm" variant="outline" onClick={actions.clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
          
          
          {/* Campo de Busca com Debounce */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Buscar Pedidos</label>
            <Input
              placeholder="Buscar por número, cliente, CPF/CNPJ..."
              value={filtersManager.filters.search || ''}
              onChange={(e) => filtersManager.updateFilter('search', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filtersManager.filters.dataInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtersManager.filters.dataInicio ? (
                      format(filtersManager.filters.dataInicio, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtersManager.filters.dataInicio}
                    onSelect={(date) => filtersManager.updateFilter('dataInicio', date)}
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
                      !filtersManager.filters.dataFim && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filtersManager.filters.dataFim ? (
                      format(filtersManager.filters.dataFim, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filtersManager.filters.dataFim}
                    onSelect={(date) => filtersManager.updateFilter('dataFim', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Controle de Colunas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colunas</label>
              <div className="space-y-2">
                <ColumnManager
                  trigger={
                    <Button variant="outline" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  }
                />
                <Button 
                  onClick={() => {
                    console.log('🔄 Resetando cache de colunas...');
                    resetColumnCache();
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  🔄 Reset Cache Colunas
                </Button>
              </div>
            </div>
          </div>

        </div>
      </Card>

      {/* 🛡️ MENSAGEM DE ERRO SEGURA */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive font-medium">
            ⚠️ {error}
          </p>
        </Card>
      )}


      

      {/* 🚀 FASE 2: Loading otimizado */}
      {/* 🎯 SEÇÃO DA TABELA DE PEDIDOS - MIGRAÇÃO GRADUAL */}
      <PedidosTableSection
        orders={displayedOrders}
        total={total}
        loading={loading}
        error={error}
        state={state}
        filters={filtersManager.appliedFilters}
        actions={actions}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
        mappingData={mappingData}
        visibleColumns={visibleColumns}
        visibleDefinitions={columnManager.visibleDefinitions}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => {
          actions.setPage(page);
        }}
        isPedidoProcessado={isPedidoProcessado}
      />


      {/* 🔗 Modal de Mapeamento Inline */}
      <MapeamentoModal
        isOpen={showMapeamentoModal}
        onClose={() => {
          setShowMapeamentoModal(false);
          setPedidoParaMapeamento(null);
        }}
        pedido={pedidoParaMapeamento}
        onSuccess={() => {
          // Recarregar mapeamentos após salvar
          if (orders && orders.length > 0) {
            mappingActions.processOrdersMappings(orders);
          }
        }}
      />

      {/* 🚀 SEÇÃO DE MODAIS - PASSO 7 COMPLETO */}
      <PedidosModalsSection
        onExport={actions.exportData}
        totalRecords={total}
        isLoading={loading}
        savedFilters={actions.getSavedFilters()}
        onSaveFilters={actions.saveCurrentFilters}
        onLoadFilters={actions.loadSavedFilters}
        hasActiveFilters={filtersManager.hasActiveFilters}
        columnManager={columnManager}
      />
        </div>
      </TabsContent>


      <TabsContent value="devolucoes" className="flex-1 overflow-auto m-0 p-6">
        <DevolucoesMercadoLivreTab />
      </TabsContent>

      {/* 🛡️ MIGRAÇÃO GRADUAL COMPLETA - Todos os 7 passos implementados */}
    </Tabs>
  );
}

export default memo(SimplePedidosPage);