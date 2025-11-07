/**
 * 🛡️ SISTEMA BLINDADO ATIVO - PEDIDOS PÁGINA PROTEGIDA
 * PROTEÇÃO: Pedidos ↔ Estoque ↔ Histórico ↔ De-Para
 * VALIDAÇÕES: SKU Kit + Total Itens + Anti-Duplicação + RLS
 * FLUXOS: SimplePedidosPage → BaixaEstoqueModal → baixar_estoque_direto → hv_insert
 */

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
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
import { Package, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, CheckCircle2, AlertTriangle, AlertCircle, Clock, Filter, Settings, CheckSquare, CalendarIcon, Search, Database } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { BaixaEstoqueModal } from './BaixaEstoqueModal';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { Pedido } from '@/types/pedido';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useLocation } from 'react-router-dom';


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

// 🔄 ETAPA 1: Polling automático (conforme PDF recomendado)
import { usePedidosPolling } from '@/hooks/usePedidosPolling';

// F4.1: Sistema de validação e limpeza automática de localStorage
import { LocalStorageValidator, useStorageValidation } from '@/utils/storageValidation';
import { ErrorBoundary, withErrorBoundary } from '@/components/common/ErrorBoundary';
import { PedidosFiltersUnified } from './PedidosFiltersUnified';
import { StatusFilters } from '@/features/orders/types/orders-status.types';

import { useColumnManager, resetColumnCache } from '@/features/pedidos/hooks/useColumnManager';
import { ColumnManager } from '@/features/pedidos/components/ColumnManager';
import '@/utils/clearColumnCache'; // Utilitário de limpeza de cache
import { PedidosTableSection } from './components/PedidosTableSection';
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
import { StatusInsumoWithTooltip } from './StatusInsumoWithTooltip';
import { CadastroInsumoRapidoModal } from './CadastroInsumoRapidoModal';
import { ConfiguracaoLocaisModal } from './ConfiguracaoLocaisModal';
import { useLocalEstoqueEnriquecimento } from '@/hooks/useLocalEstoqueEnriquecimento';

import { FEATURES } from '@/config/features';

type Order = {
  id: string;
  numero: string;
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
  const { cleanStorage, validateAndGet, checkHealth } = useStorageValidation();
  
  // F4.1: CORREÇÃO CRÍTICA - Limpeza automática e validação de localStorage
  useEffect(() => {
    try {
      console.log('🧹 [F4.1] Iniciando limpeza e validação de localStorage...');
      
      // Verificar saúde geral do localStorage
      const health = checkHealth();
      if (!health.healthy) {
        console.warn('⚠️ [Storage Health] Problemas detectados:', health.issues);
        toast(`⚠️ Problemas no armazenamento local: ${health.issues.join(', ')}`);
      }
      
      // Limpeza automática de dados corrompidos
      const cleaned = LocalStorageValidator.cleanCorruptedStorage([
        'pedidos_unified_filters',
        'pedidos_persistent_state', 
        'pedidos-saved-filters',
        'pedidos-column-preferences',
        'pedidos:lastSearch'
      ]);
      
      if (cleaned > 0) {
        console.log(`✅ [F4.1] ${cleaned} entradas corrompidas foram limpas`);
      }
      
      // 🔄 VERSÃO DO CACHE - Forçar limpeza quando há mudanças no sistema de colunas
      const COLUMN_CACHE_VERSION = 5; // v5: Remoção completa de 5 colunas financeiras/shipping
      const columnCache = validateAndGet('pedidos-column-preferences', null);
      
      if (columnCache && typeof columnCache === 'object') {
        const cacheVersion = columnCache.version || 1;
        
        // Se a versão do cache é diferente, limpar
        if (cacheVersion !== COLUMN_CACHE_VERSION) {
          localStorage.removeItem('pedidos-column-preferences');
          localStorage.removeItem('pedidos-column-preferences-v4');
          localStorage.removeItem('pedidos-column-preferences-v5');
          localStorage.removeItem('pedidos:lastSearch');
          console.log(`🔄 [CACHE] Cache de colunas limpo completamente - versão ${cacheVersion} → ${COLUMN_CACHE_VERSION}`);
        }
      }
      
    } catch (error) {
      console.error('❌ [F4.1] Erro durante limpeza de localStorage:', error);
      toast.error('Erro ao limpar dados locais. Alguns recursos podem não funcionar corretamente.');
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
  // ✅ ETAPA 3: 100% baseado em URL params para filtros persistentes
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
    loadSavedFilters: false,
    enableURLSync: true // ✅ ETAPA 3: Ativar sincronização com URL
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
  
  // ✅ CRÍTICO: Aplicar filtros automaticamente quando restaurados do localStorage
  const hasAppliedRestoredFilters = useRef(false);
  
  useEffect(() => {
    // Se já aplicou uma vez, não fazer nada
    if (hasAppliedRestoredFilters.current) return;
    
    const hasRestoredFilters = filtersManager.appliedFilters && Object.keys(filtersManager.appliedFilters).length > 0;
    
    if (hasRestoredFilters) {
      console.log('🔄 [FILTROS RESTAURADOS] Aplicando automaticamente...', filtersManager.appliedFilters);
      
      // Marcar que já aplicou
      hasAppliedRestoredFilters.current = true;
      
      // Aplicar filtros no manager
      actions.replaceFilters(filtersManager.appliedFilters);
      
      // NÃO limpar persistentState aqui pois estamos restaurando
    }
  }, [filtersManager.appliedFilters, actions]); // ✅ Executar quando appliedFilters mudar
  
  // 🔧 P3.1: Sistema de colunas unificado com persistência automatica (memoizado)
  const columnManager = useColumnManager();
  const visibleColumns = useMemo(() => {
    return columnManager.state.visibleColumns;
  }, [columnManager.state.visibleColumns]);
  
  
  
  // Estados locais para funcionalidades específicas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  
  // ✅ FASE 3: Estado para seleção de provider (Shopee + ML)
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  
  // 🔗 Estado do modal de mapeamento
  const [showMapeamentoModal, setShowMapeamentoModal] = useState(false);
  const [pedidoParaMapeamento, setPedidoParaMapeamento] = useState<any>(null);
  
  // 🗺️ Estado do modal de configuração de locais
  const [showLocaisModal, setShowLocaisModal] = useState(false);
  
  // 🧠 P3.2: Hook de mapeamentos otimizado - CORREÇÃO DE PERFORMANCE (debounce aumentado)
  const {
    mappingData,
    isProcessingMappings,
    processingStats,
    cacheStats,
    actions: mappingActions
  } = usePedidosMappingsOptimized({
    enabled: true,
    autoProcess: true,
    debounceMs: 1000, // P3.2: Debounce maior para melhor performance (1s)
    onMappingUpdate: (mappings) => {
      // Callback silencioso para performance
    }
  });
  
  // Hook para verificar pedidos já processados
  const { pedidosProcessados, verificarPedidos, isLoading: loadingProcessados, isPedidoProcessado } = usePedidosProcessados();
  
  // 📍 Hook para enriquecer pedidos com local de estoque
  const { rowsEnriquecidos, loading: loadingLocais } = useLocalEstoqueEnriquecimento(state.orders);

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
  
  // Aliases para compatibilidade - usando rows enriquecidos com local de estoque
  const orders = rowsEnriquecidos;
  const total = state.total;
  const loading = state.loading || loadingLocais;
  const error = state.error;
  const currentPage = state.currentPage;
  const integrationAccountId = state.integrationAccountId;
  
  // P3.1: Hook para contadores agregados (totais globais para os cards) - memoizado
  const aggregatorParams = useMemo(() => ({
    integrationAccountId,
    filters: filtersManager.appliedFilters
  }), [integrationAccountId, filtersManager.appliedFilters]);
  
  const { counts: globalCounts, loading: loadingCounts } = usePedidosAggregator(
    aggregatorParams.integrationAccountId,
    aggregatorParams.filters
  );
  
  // Filtro rápido (apenas client-side) - COM PERSISTÊNCIA
  const [quickFilter, setQuickFilter] = useState<'all' | 'pronto_baixar' | 'mapear_incompleto' | 'baixado' | 'shipped' | 'delivered' | 'sem_estoque' | 'sku_nao_cadastrado' | 'sem_composicao'>(() => {
    return persistentState.persistedState?.quickFilter as any || 'all';
  });
  
  // 🔄 ETAPA 1: Polling automático a cada 60s (PDF recomendado) - CORRIGIDO
  const polling = usePedidosPolling({
    // ✅ FIX CRÍTICO: Removido "orders.length > 0" - polling funciona mesmo com lista vazia
    // Isso garante que novos pedidos apareçam automaticamente mesmo se lista começar vazia
    enabled: !loading && !state.isRefreshing,
    intervalMs: 60000, // 60 segundos
    onRefresh: () => {
      console.log('🔄 [POLLING] Atualizando dados automaticamente...');
      actions.refetch();
    },
    pauseOnInteraction: true // Pausa quando usuário está interagindo
  });

  // P3.1: Lista exibida considerando o filtro rápido (memoizada para performance)
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
          // ✅ CRÍTICO: Só está pronto se NÃO houver problemas (sku não cadastrado OU sem estoque)
          const semProblemas = mapping?.statusBaixa !== 'sku_nao_cadastrado' && mapping?.statusBaixa !== 'sem_estoque';
          return temMapeamentoCompleto && !baixado && semProblemas;
        }
        case 'mapear_incompleto': {
          const temIncompleto = !!(mapping && mapping.temMapeamento && !(mapping.skuEstoque || mapping.skuKit));
          const baixado = isPedidoProcessado(order);
          return temIncompleto && !baixado;
        }
        case 'baixado':
          return !!isPedidoProcessado(order) || String(order?.status_baixa || '').toLowerCase().includes('baixado');
        case 'sem_estoque':
          return mapping?.statusBaixa === 'sem_estoque';
        case 'sku_nao_cadastrado':
          return mapping?.statusBaixa === 'sku_nao_cadastrado';
        case 'sem_composicao':
          return mapping?.statusBaixa === 'sem_composicao';
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
  
// 🔄 P3.1: SALVAR DADOS quando eles mudarem (após busca) - com debounce
  const debouncedSaveData = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (orders: any[], total: number, currentPage: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        persistentState.saveOrdersData(orders, total, currentPage);
      }, 1000); // Debounce de 1s para evitar saves excessivos
    };
  }, [persistentState]);

  useEffect(() => {
    if (orders && orders.length > 0 && !loading) {
      debouncedSaveData(orders, total, currentPage);
    }
  }, [orders, total, currentPage, loading, debouncedSaveData]);
  
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
      
      verificarPedidos(orders as any);
      // ✅ Usar a função correta que processa diretamente
      mappingActions.processOrdersMappings(orders as any);
    }
  }, [orders]); // ✅ Dependência otimizada - removida verificarPedidos para evitar loops
  
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
  
  // Helpers financeiros: receita_por_envio (Flex) - REGRA SIMPLES
  const getReceitaPorEnvio = (order: any): number => {
    // 🔧 HELPER: Processar flex_order_cost - TEMPORARIAMENTE DESABILITADO
    const getFlexOrderCostProcessed = (order: any): number => {
      const flexCostOriginal = order?.flex_order_cost || order?.unified?.flex_order_cost || 0;
      // ⚠️ CÁLCULO DESABILITADO: Retornando valor bruto da API
      return flexCostOriginal;
      
      /* CÁLCULO ORIGINAL (DESABILITADO):
      let flexCost = flexCostOriginal;
      if (flexCost <= 0) return 0;
      
      // ✅ Se for 8.90, 13.90, 15.90 ou 15.99 → mantém valor
      // Caso contrário → divide por 2
      const valoresFixos = [8.90, 13.90, 15.90, 15.99];
      const foiDividido = !valoresFixos.includes(flexCost);
      
      if (foiDividido) {
        flexCost = flexCost / 2;
      }
      
      return flexCost;
      */
    };
    
    // Detectar o tipo logístico
    const rawType =
      order?.shipping?.logistic?.type ??
      order?.raw?.shipping?.logistic?.type ??
      order?.logistic_type ??
      order?.shipping_details?.logistic_type ??
      order?.unified?.logistic?.type ??
      order?.flex_logistic_type ??
      order?.logistic?.type;

    const logisticType = String(rawType || '').toLowerCase();
    
    // Se não for 'self_service' (Envios Flex), retornar 0
    if (logisticType !== 'self_service') {
      return 0;
    }
    
    // ✅ NOVA REGRA: Usar Flex: Desconto Especial + condições
    const flexSpecialDiscount = order.flex_special_discount || order.unified?.flex_special_discount || 0;
    const flexNetCost = order.flex_net_cost || order.unified?.flex_net_cost || 0;
    
    // Valores específicos que devem ser usados diretamente
    const valoresEspecificos = [8.90, 8.99, 13.90, 13.99, 15.90, 15.99];
    
    // Determinar a base do cálculo
    const flexOrderCostBase = valoresEspecificos.includes(flexSpecialDiscount) 
      ? flexSpecialDiscount 
      : flexSpecialDiscount + flexNetCost;
    
    // Se não houver valor, retornar 0
    if (flexOrderCostBase <= 0) {
      return 0;
    }
    
    // ✅ NOVA LÓGICA: Verificar Valor Médio por Item PRIMEIRO
    const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
    const quantidadeTotal = order.quantidade_total || 1;
    const valorMedioPorItem = valorTotal / quantidadeTotal;
    
    // Se Valor Médio por Item < 79.00 → usar cálculo normal (100%)
    if (valorMedioPorItem < 79.00) {
      return flexOrderCostBase;
    }
    
    // Se Valor Médio por Item >= 79.00 → verificar todas as outras condições
    const conditionRaw = order.unified?.conditions || order.raw?.items?.[0]?.item?.condition || order.conditions || order.condition || order.unified?.condition || '';
    const condition = String(conditionRaw).toLowerCase();
    
    // ✅ CORRIGIDO: Buscar reputation em TODOS os lugares possíveis
    const reputationRaw = order.level_id || 
                         order.seller_reputation?.level_id || 
                         order.unified?.seller_reputation?.level_id ||
                         order.sellerReputation?.level_id ||
                         order.raw?.seller_reputation?.level_id ||
                         order.raw?.sellerReputation?.level_id ||
                         '';
    const reputation = String(reputationRaw).toLowerCase();
    
    const medalha = order.power_seller_status || 
                   order.unified?.power_seller_status || 
                   order.raw?.power_seller_status ||
                   order.raw?.seller_reputation?.power_seller_status ||
                   order.raw?.sellerReputation?.power_seller_status ||
                   order.seller_reputation?.power_seller_status ||
                   order.unified?.seller_reputation?.power_seller_status ||
                   null;
    
    // ✅ REGRA OFICIAL ML: Acima R$ 79 SÓ recebe bônus se tiver qualificações
    // Se TODAS as condições forem atendidas → aplicar 10%
    // Se NÃO tiver qualificações → R$ 0,00 (sem bônus)
    const cumpreCondicoes = condition === 'new' && reputation.includes('green'); // ✅ Removida verificação de medalha
    const percentualAplicado = cumpreCondicoes ? 0.1 : 0; // ✅ CORRIGIDO: 0% sem qualificações
    const valorFinal = flexOrderCostBase * percentualAplicado;
    
    // ✅ Retornar valor calculado (0% ou 10% conforme qualificações)
    return valorFinal;
  };
  
  const getValorLiquidoVendedor = (order: any): number => {
    if (typeof order?.valor_liquido_vendedor === 'number') return order.valor_liquido_vendedor;

    // ✅ NOVA REGRA: Baseado no Tipo Logístico
    const valorTotal = order.valor_total || order.unified?.valor_total || order.total_amount || order.unified?.total_amount || 0;
    
    // Calcular Receita Flex usando a função getReceitaPorEnvio
    const receitaFlex = getReceitaPorEnvio(order);
    
    const taxaMarketplace = order.order_items?.[0]?.sale_fee || order.raw?.order_items?.[0]?.sale_fee || order.marketplace_fee || order.fees?.[0]?.value || order.raw?.fees?.[0]?.value || 0;
    const custoEnvioSeller = order.custo_envio_seller || order.unified?.custo_envio_seller || order.shipping?.costs?.senders?.[0]?.cost || order.raw?.shipping?.costs?.senders?.[0]?.cost || 0;
    
    // Determinar tipo logístico
    const rawType = order?.tipo_logistico || 
                   order?.unified?.tipo_logistico || 
                   order?.shipping?.logistic_type || 
                   order?.raw?.shipping?.logistic_type ||
                   order?.shipping?.logistic?.type ||
                   order?.unified?.shipping?.logistic?.type ||
                   order?.logistic_type ||
                   order?.flex_logistic_type ||
                   '';
    const tipoLogistico = String(rawType).toLowerCase();
    
    // Se for "self_service" (Envios Flex): Valor Total + Receita Flex - Taxa Marketplace
    // Se não for Flex: Valor Total + Receita Flex - Taxa Marketplace - Custo Envio Seller
    const isFlex = tipoLogistico === 'self_service' || tipoLogistico.includes('flex');
    const valorLiquido = isFlex 
      ? valorTotal + receitaFlex - taxaMarketplace
      : valorTotal + receitaFlex - taxaMarketplace - custoEnvioSeller;

    return valorLiquido;
  };
  
  const getValorLiquidoVendedor_OLD_BACKUP = (order: any): number => {
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
  type ColumnDef = { key: string; label: string; default: boolean; category?: string; width?: number };
  const allColumns: ColumnDef[] = [
    // Básicas
    { key: 'id', label: 'ID-Único', default: true, category: 'basic' },
    { key: 'empresa', label: 'Empresa', default: true, category: 'basic' },
    { key: 'numero', label: 'ID do Pedido (ML)', default: true, category: 'basic' },
    { key: 'nome_completo', label: 'Nome Completo', default: true, category: 'basic' },
    { key: 'data_pedido', label: 'Data do Pedido', default: true, category: 'basic' },
    { key: 'last_updated', label: 'Última Atualização', default: false, category: 'basic' },

    // Produtos
    { key: 'skus_produtos', label: 'SKUs/Produtos', default: true, category: 'products' },
    { key: 'quantidade_itens', label: 'Quantidade Total', default: true, category: 'products' },
    { key: 'titulo_anuncio', label: 'Título do Produto', default: true, category: 'products' },

    // Financeiro - CAMPOS SEPARADOS E EXCLUSIVOS
    { key: 'valor_total', label: 'Valor Total', default: true, category: 'financial' },
    
    // 💰 FLEX & CUSTOS (Ocultos por padrão)
    { key: 'receita_flex', label: 'Receita Flex (Bônus)', default: false, category: 'financial' },
    { key: 'custo_envio_seller', label: 'Custo Envio Seller', default: false, category: 'financial' },
    
    { key: 'marketplace_fee', label: 'Taxa Marketplace', default: true, category: 'financial' },
    { key: 'custo_fixo_meli', label: 'Custo Fixo Meli', default: false, category: 'financial' },
    { key: 'valor_liquido_vendedor', label: 'Valor Líquido Vendedor', default: true, category: 'financial' },
    { key: 'payment_method', label: 'Método Pagamento', default: false, category: 'financial' },
    { key: 'payment_status', label: 'Status Pagamento', default: false, category: 'financial' },

    // Mapeamento  
    { key: 'cpf_cnpj', label: 'CPF/CNPJ', default: true, category: 'mapping' },
    { key: 'sku_estoque', label: 'SKU Estoque', default: true, category: 'mapping' },
    { key: 'sku_kit', label: 'SKU KIT', default: false, category: 'mapping' },
    { key: 'qtd_kit', label: 'Quantidade KIT', default: false, category: 'mapping' },
    { key: 'total_itens', label: 'Total de Itens', default: true, category: 'mapping' },
    { key: 'status_baixa', label: 'Status da Baixa', default: true, category: 'mapping' },
    { key: 'status_insumos', label: 'Status Insumos', default: true, category: 'mapping' },
    
    // Status
    { key: 'situacao', label: 'Status do Pagamento', default: true, category: 'shipping' },

    // Metadados ML
    { key: 'date_created', label: 'Data Criação ML', default: false, category: 'meta' },
    { key: 'pickup_id', label: 'Pickup ID', default: false, category: 'meta' },
    { key: 'tags', label: 'Tags', default: false, category: 'meta', width: 350 },

    // Envio (combinado)
    { key: 'shipping_status', label: 'Status do Envio', default: true, category: 'shipping', width: 150 },
    { key: 'logistic_mode', label: 'Logistic Mode (Principal)', default: false, category: 'shipping' },
    { key: 'logistic_type', label: 'Tipo Logístico', default: false, category: 'shipping', width: 150 },
    
    // Reputação do Vendedor
    { key: 'power_seller_status', label: 'Medalha', default: false, category: 'shipping', width: 150 },
    { key: 'level_id', label: 'Reputação', default: false, category: 'shipping' },
    
    { key: 'substatus_detail', label: 'Substatus (Estado Atual)', default: false, category: 'shipping' },
    { key: 'shipping_mode', label: 'Modo de Envio (Combinado)', default: false, category: 'shipping' },
    
    // Endereço
    { key: 'endereco_rua', label: 'Rua', default: false, category: 'shipping' },
    { key: 'endereco_numero', label: 'Número (Endereço)', default: false, category: 'shipping' },
    { key: 'endereco_bairro', label: 'Bairro', default: false, category: 'shipping' },
    { key: 'endereco_cep', label: 'CEP', default: false, category: 'shipping' },
    { key: 'endereco_cidade', label: 'Cidade', default: false, category: 'shipping' },
    { key: 'endereco_uf', label: 'UF', default: false, category: 'shipping', width: 150 },
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

    const statusBaixa = mapping.statusBaixa;
    const baixado = isPedidoProcessado({ id: pedidoId } as any);
    
    // 🔍 DEBUG: Log do status final renderizado
    console.log(`🎨 [Render] Pedido ${pedidoId} | Status renderizado: ${statusBaixa}`, mapping);

    // 🛡️ PRIORIDADE: Status de problemas críticos
    if (statusBaixa === 'sku_nao_cadastrado') {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">SKU não cadastrado no estoque</span>
        </div>
      );
    }

    if (statusBaixa === 'sem_estoque') {
      return (
        <div className="flex items-center gap-1 text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Sem Estoque</span>
        </div>
      );
    }

    // ✅ Status já baixado
    if (baixado) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Baixado</span>
        </div>
      );
    }

    // ✅ Pronto para baixar (tem mapeamento e não tem problemas)
    if (statusBaixa === 'pronto_baixar') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Pronto p/ Baixar</span>
        </div>
      );
    }

    // ⚠️ Sem mapear
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Sem mapear</span>
      </div>
    );
  };

  // 🔧 Estado para modal de cadastro rápido
  const [cadastroRapidoOpen, setCadastroRapidoOpen] = useState(false);
  const [skuParaCadastro, setSkuParaCadastro] = useState('');

  // 🗺️ Estado para modal de configuração de locais de estoque
  const [configLocaisOpen, setConfigLocaisOpen] = useState(false);

  // 🔧 Renderizar Status de Insumos com Tooltip e Cadastro Rápido
  const renderStatusInsumos = (pedidoId: string) => {
    const mapping = mappingData.get(pedidoId);
    
    if (!mapping || !mapping.statusInsumo) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
      <StatusInsumoWithTooltip
        statusInsumo={mapping.statusInsumo}
        detalhesInsumo={mapping.detalhesInsumo}
        onCadastrarClick={(sku) => {
          setSkuParaCadastro(sku);
          setCadastroRapidoOpen(true);
        }}
      />
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

  // 🔄 ETAPA 1: REMOVIDO setInterval de validação (5s)
  // Substituído por polling automático de 60s mais eficiente
  // A validação agora acontece apenas quando necessário, não a cada 5s


  const navigate = useNavigate();
  const location = useLocation();
  const isDevolucoesRoute = location.pathname === '/ml-orders-completas';

  // Render principal
  return (
    <div className="h-screen flex flex-col">{/* Conteúdo */}

      <div className="flex-1 overflow-auto m-0">
        <div className="space-y-6">
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
        onOpenConfigLocais={() => setConfigLocaisOpen(true)}
      />

      {/* Sub-navegação */}
      <MLOrdersNav />

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
        orders={displayedOrders || orders}
        quickFilter={quickFilter}
        onQuickFilterChange={(filter) => setQuickFilter(filter)}
        mappingData={mappingData}
        isPedidoProcessado={isPedidoProcessado}
        globalCounts={globalCounts}
        loadingCounts={loadingCounts}
        totalRecords={state.total}
        hasActiveFilters={
          !!filtersManager.appliedFilters?.dataInicio || 
          !!filtersManager.appliedFilters?.dataFim || 
          !!filtersManager.appliedFilters?.search ||
          (filtersManager.appliedFilters?.contasML && filtersManager.appliedFilters.contasML.length > 0) ||
          (filtersManager.appliedFilters?.statusPedido && filtersManager.appliedFilters.statusPedido.length > 0)
        }
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

      {/* ✅ NOVO SISTEMA DE FILTROS UNIFICADO - UX CONSISTENTE */}
        {/* F4.3: PedidosFiltersUnified com Error Boundary */}
        <ErrorBoundary name="PedidosFiltersUnified">
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
        </ErrorBoundary>
      
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
            {/* F4.3: PedidosTableSection com Error Boundary */}
            <ErrorBoundary name="PedidosTableSection">
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
        renderStatusBaixa={renderStatusBaixa}
        renderStatusInsumos={renderStatusInsumos}
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

      {/* 🆕 Modal de Cadastro Rápido de Insumo */}
      <CadastroInsumoRapidoModal
        isOpen={cadastroRapidoOpen}
        onClose={() => {
          setCadastroRapidoOpen(false);
          setSkuParaCadastro('');
        }}
        skuInsumo={skuParaCadastro}
        onSuccess={() => {
          // Recarregar mapeamentos após cadastrar
          if (orders && orders.length > 0) {
            mappingActions.processOrdersMappings(orders);
          }
        }}
      />

      {/* 🗺️ MODAL: Configuração de Locais de Estoque */}
      <ConfiguracaoLocaisModal
        open={configLocaisOpen}
        onOpenChange={setConfigLocaisOpen}
        empresasSelecionadas={filtersManager.appliedFilters?.contasML || []}
        contasML={accounts}
      />
            </ErrorBoundary>
        </div>
      </div>

      {/* 🛡️ MIGRAÇÃO GRADUAL COMPLETA - Todos os 7 passos implementados */}
    </div>
  );
}

// F4.3: Envolver componentes críticos com Error Boundary
const SimplePedidosPageWithErrorBoundary = withErrorBoundary(SimplePedidosPage, 'SimplePedidosPage');

// F4.3: Exportar versão com Error Boundary
export default SimplePedidosPageWithErrorBoundary;