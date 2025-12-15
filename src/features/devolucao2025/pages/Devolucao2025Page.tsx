/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES DE VENDA
 * Implementação completa com 65 colunas + Sistema de Alertas + Cache Inteligente
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { Devolucao2025Table } from '../components/Devolucao2025Table';
import { Devolucao2025FilterBar } from '../components/Devolucao2025FilterBar';
import { Devolucao2025Stats } from '../components/Devolucao2025Stats';
import { Devolucao2025Resumo, FiltroResumo } from '../components/Devolucao2025Resumo';
import { Devolucao2025PaginationFooter } from '../components/Devolucao2025PaginationFooter';
import { ExportButton } from '../components/ExportButton';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { DevolucaoAlertsPanel } from '../components/DevolucaoAlertsPanel';
import { DevolucaoAlertsBadge } from '../components/DevolucaoAlertsBadge';
import { useDevolucaoAlerts } from '../hooks/useDevolucaoAlerts';
// ✅ CORREÇÃO MÉDIA 7: Removido import inútil useColumnPreferences (substituído por columnManager)
import { COLUMNS_CONFIG } from '../config/columns';
import { usePersistentDevolucoesStateV2 } from '../hooks/usePersistentDevolucoesStateV2';
import { useDevolucoesFiltersUnified } from '../hooks/useDevolucoesFiltersUnified';
import { useDevolucoesColumnManager } from '../hooks/useDevolucoesColumnManager';
import { useDevolucoesAggregator } from '../hooks/useDevolucoesAggregator';
import { useMLClaimsFromCache } from '@/hooks/useMLClaimsFromCache';
import { useDevolucoesLocalCache } from '../hooks/useDevolucoesLocalCache';
import { useDevolucoesStore } from '../store/devolucoesStore';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevolucaoStorage } from '../hooks/useDevolucaoStorage';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS, STATUS_HISTORICO } from '../types/devolucao-analise.types';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { LoadingIndicator } from '@/components/pedidos/LoadingIndicator';
import { Devolucao2025AnotacoesModal } from '../components/modals/Devolucao2025AnotacoesModal';

export const Devolucao2025Page = () => {
  const { isSidebarCollapsed } = useSidebarUI();
  const queryClient = useQueryClient();
  
  // FASE 1: Estado de persistência com validação robusta
  // FASE 2: Gerenciamento unificado de filtros com URL sync
  // FASE 3: Gerenciamento avançado de colunas
  // FASE 4: Polling automático e agregação de métricas
  const {
    pendingFilters,
    appliedFilters,
    updateFilter,
    updateDateRange,
    applyFilters: applyFiltersInternal,
    hasPendingChanges,
    isApplying,
    changePage,
    changeItemsPerPage,
    changeTab,
  } = useDevolucoesFiltersUnified();
  
  const columnManager = useDevolucoesColumnManager();
  
  // 🚀 COMBO 2.1: Cache local para restauração instantânea
  const localCache = useDevolucoesLocalCache();
  
  // 🗄️ ERRO 2 CORRIGIDO: Store Zustand para restauração direta (padrão /vendas-online)
  const { 
    devolucoes: storeDevolucoes, 
    setDevolucoes, 
    dataSource: storeDataSource,
    hasDevolucoes 
  } = useDevolucoesStore();
  
  // 🚀 COMBO 2.1: Estado de busca controlado (NÃO busca automaticamente)
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // ✅ ERRO 2 CORRIGIDO: Flag para evitar restauração duplicada
  const hasRestoredFromCache = useRef(false);
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    removeDevolucao
  } = useDevolucaoStorage();
  
  // Estados derivados dos filtros (appliedFilters para busca, pendingFilters para UI)
  const selectedAccounts = appliedFilters.selectedAccounts;
  const searchTerm = pendingFilters.searchTerm;
  const currentPage = appliedFilters.currentPage;
  const itemsPerPage = appliedFilters.itemsPerPage;
  const activeTab = appliedFilters.activeTab;
  
  // Estados locais não gerenciados por filtros
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [filtroResumo, setFiltroResumo] = useState<FiltroResumo | null>(null);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [selectedOrderForAnotacoes, setSelectedOrderForAnotacoes] = useState<string | null>(null);
  
  // ✅ CORREÇÃO 10+5: Lazy initializer para evitar race condition
  const [appliedAccounts, setAppliedAccounts] = useState<string[]>(() => selectedAccounts);

  // ✅ COMBO 2.1: Calcular datas baseado em startDate/endDate (Date objects)
  const backendDateRange = useMemo(() => {
    return { 
      from: appliedFilters.startDate || new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 
      to: appliedFilters.endDate || new Date() 
    };
  }, [appliedFilters.startDate, appliedFilters.endDate]);
  
  // DateRange visual para filtro local
  useEffect(() => {
    setDateRange(backendDateRange);
  }, [backendDateRange]);
  
  // ✅ REMOVIDO: useColumnPreferences (substituído por columnManager FASE 3)

  // Buscar organization_id do usuário
  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('organizacao_id')
          .eq('id', user.id)
          .single();
        
        if (data?.organizacao_id) {
          setOrganizationId(data.organizacao_id);
        }
      }
    };
    fetchOrganization();
  }, []);

  // Buscar contas de integração
  const { data: accounts = [] } = useQuery({
    queryKey: ['integration-accounts-ml'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name, account_identifier')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // 🔄 CORREÇÃO 4+5: Sincronizar appliedAccounts quando selectedAccounts OU accounts mudarem
  // ✅ COMBO 2.1: Sincronizar appliedAccounts E pendingFilters.selectedAccounts
  useEffect(() => {
    const newSerialized = selectedAccounts.slice().sort().join('|');
    const currentSerialized = appliedAccounts.slice().sort().join('|');
    
    // Se selectedAccounts mudou e não está vazio, aplicar
    if (selectedAccounts.length > 0 && newSerialized !== currentSerialized) {
      console.log('🔄 [SYNC] Sincronizando appliedAccounts:', selectedAccounts);
      setAppliedAccounts(selectedAccounts);
    }
    // FALLBACK: Se appliedAccounts está vazio mas accounts carregou, usar todas contas
    else if (appliedAccounts.length === 0 && accounts.length > 0) {
      const allAccountIds = accounts.map(acc => acc.id);
      console.log('🔄 [SYNC FALLBACK] Inicializando appliedAccounts com todas contas:', accounts.length);
      setAppliedAccounts(allAccountIds);
      
      // ✅ AUDITORIA FIX: Sincronizar também pendingFilters para UI consistente
      if (pendingFilters.selectedAccounts.length === 0) {
        console.log('🔄 [SYNC FALLBACK] Sincronizando pendingFilters.selectedAccounts');
        updateFilter('selectedAccounts', allAccountIds);
      }
    }
  }, [selectedAccounts, appliedAccounts, accounts, pendingFilters.selectedAccounts.length, updateFilter]);

  // 🚀 COMBO 2.1 - IGUAL /vendas-online
  // Cache consulta SEMPRE se há contas, API só quando shouldFetch ou cache expirado
  
  // ✅ CORREÇÃO: Usar appliedAccounts (sincronizado) ao invés de selectedAccounts
  const accountIds = appliedAccounts.length > 0 
    ? appliedAccounts 
    : (accounts.length > 0 ? accounts.map(a => a.id) : []);
  
  // 🚀 ERRO 3 CORRIGIDO: Busca MANUAL obrigatória (padrão Combo 2.1)
  // ANTES: shouldFetch || (!localCache.hasCachedData && !hasDevolucoes() && accountIds.length > 0)
  // PROBLEMA: localCache.hasCachedData sempre false → query sempre dispara
  // CORREÇÃO: Usar APENAS shouldFetch - store já tem dados via restauração do ERRO 2
  const shouldQueryCache = shouldFetch;
  
  // ✅ ERRO 2 CORRIGIDO: Restauração DIRETA no store no mount (padrão /vendas-online)
  // ✅ AUDITORIA: Verifica se store JÁ tem dados antes de restaurar (evita sobrescrever dados mais recentes)
  useEffect(() => {
    if (hasRestoredFromCache.current) return;
    
    // ✅ Se store já tem dados (persist entre navegações), não sobrescrever com localStorage
    if (hasDevolucoes()) {
      console.log('⚡ [STORE] Store já tem dados, pulando restauração do localStorage');
      hasRestoredFromCache.current = true;
      return;
    }
    
    const cached = localCache.cachedData;
    const totalCount = localCache.cachedTotalCount || 0;
    
    if (cached && cached.length > 0) {
      console.log('⚡ [STORE] Restaurando localStorage DIRETO no store:', cached.length);
      setDevolucoes(cached, totalCount, 'localStorage');
      hasRestoredFromCache.current = true;
    }
  }, [localCache.cachedData, localCache.cachedTotalCount, setDevolucoes, hasDevolucoes]);
  
  const cacheQuery = useMLClaimsFromCache({
    integration_account_ids: accountIds,
    date_from: backendDateRange.from.toISOString(),
    date_to: backendDateRange.to.toISOString(),
    enabled: shouldQueryCache // ✅ COMBO 2.1: Só busca quando necessário
  });

  // 🔧 CORREÇÃO: Se cache retornou dados válidos E não está loading, usar cache
  const useCacheData = !cacheQuery.isLoading && cacheQuery.data && !cacheQuery.data.cache_expired;

  // ✅ FALLBACK: Buscar de API quando:
  // 1. Cache expirou/vazio E cache terminou loading E há contas
  // 2. OU usuário clicou buscar manualmente (shouldFetch)
  const cacheExpired = !cacheQuery.isLoading && (cacheQuery.data?.cache_expired || !cacheQuery.data?.devolucoes?.length);
  const shouldFetchFromAPI = accountIds.length > 0 && 
    !cacheQuery.isLoading && 
    (cacheExpired || shouldFetch);

  // 🚀 ERRO 2 CORRIGIDO: Agora usa STORE como fonte principal (padrão /vendas-online)
  // devolucoesCompletas simplesmente retorna dados do store
  const devolucoesCompletas = storeDevolucoes;

  // ✅ CORREÇÃO: dataSource reflete a fonte REAL dos dados mostrados
  const dataSource = storeDataSource;
  
  // ✅ CORREÇÃO: isLoading = false se já tem dados no store para mostrar
  const isLoading = cacheQuery.isLoading && !hasDevolucoes();
  const isFetching = cacheQuery.isFetching;
  const error = cacheQuery.error;

  // 🚀 COMBO 2.1 CORRIGIDO: Salvar no localStorage E atualizar store quando query retornar
  // ✅ ERRO 1 CORRIGIDO: Removido condição shouldFetch - salva sempre que Supabase retorna dados
  // ✅ AUDITORIA: Usar saveToCache diretamente (memoizado) para evitar loop infinito
  const { saveToCache } = localCache;
  
  useEffect(() => {
    const devolucoes = cacheQuery.data?.devolucoes;
    const totalCount = cacheQuery.data?.total_count || 0;
    
    // ✅ Atualizar store E localStorage quando tiver dados novos do Supabase
    if (devolucoes && devolucoes.length > 0) {
      console.log('💾 [COMBO 2.1] Atualizando store + localStorage:', devolucoes.length);
      
      // ✅ ERRO 2 CORRIGIDO: Atualizar STORE diretamente (padrão /vendas-online)
      setDevolucoes(devolucoes, totalCount, 'cache');
      
      // Salvar no localStorage também
      saveToCache(
        devolucoes,
        {
          accounts: accountIds,
          dateFrom: backendDateRange.from.toISOString(),
          dateTo: backendDateRange.to.toISOString()
        },
        totalCount
      );
    }
  }, [cacheQuery.data, accountIds, backendDateRange, saveToCache, setDevolucoes]);

  // 📊 Log detalhado da fonte de dados (COMBO 2.1)
  useEffect(() => {
    console.log('🚀 [COMBO 2.1] Estado atual:', {
      shouldFetch,
      hasCachedData: localCache.hasCachedData,
      devolucoesCount: devolucoesCompletas.length,
      dataSource,
      isLoading
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devolucoesCompletas.length, dataSource, shouldFetch]);

  // Filtrar localmente baseado nas preferências do usuário
  const devolucoes = useMemo(() => {
    console.log(`🔍 [FILTRO LOCAL] Iniciando com ${devolucoesCompletas.length} devoluções completas`);
    let filtered = devolucoesCompletas;
    
    // 🎯 FILTRO TIPO: Apenas devoluções (tipo_claim = 'returns')
    const beforeTypeFilter = filtered.length;
    filtered = filtered.filter(dev => dev.tipo_claim === 'returns');
    console.log(`🏷️ [FILTRO TIPO] ${beforeTypeFilter} → ${filtered.length} (apenas tipo 'returns' - devoluções)`);
    
    // 🔍 FILTRO CRÍTICO DE RETURN: Apenas aplicar se dados vierem da API (enriquecidos)
    // Dados do CACHE (Combo 2) não têm return_id/status_return, então pular este filtro
    if (dataSource === 'api') {
      const beforeReturnFilter = filtered.length;
      filtered = filtered.filter(dev => {
        // API retorna dados enriquecidos com return_id e status_return
        const hasReturnId = dev.return_id && dev.return_id.trim() !== '';
        const hasReturnStatus = dev.status_return && dev.status_return !== '-' && dev.status_return.trim() !== '';
        return hasReturnId || hasReturnStatus;
      });
      console.log(`🔍 [FILTRO DEVOLUÇÕES REAIS - API] ${beforeReturnFilter} → ${filtered.length} (eliminados ${beforeReturnFilter - filtered.length} claims sem devolução)`);
    } else {
      console.log(`⚡ [FILTRO DEVOLUÇÕES REAIS - CACHE] Pulando filtro (cache Combo 2 não tem return_id)`);
    }
    
    // Filtro de período (local)
    // ✅ CORREÇÃO CRÍTICA: Usar 'date_created' (campo do cache Combo 2), não 'data_criacao'
    if (dateRange.from && dateRange.to) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(dev => {
        if (!dev.date_created) return false; // ✅ Campo correto do cache
        const dataCriacao = parseISO(dev.date_created);
        return dataCriacao >= dateRange.from && dataCriacao <= dateRange.to;
      });
      console.log(`📅 [FILTRO PERÍODO] ${beforeFilter} → ${filtered.length} (período: ${dateRange.from.toLocaleDateString()} a ${dateRange.to.toLocaleDateString()})`);
    }
    
    // ✅ Filtro de contas removido - já filtrado no backend via selectedAccounts
    
    console.log(`🎯 [FILTRO LOCAL FINAL] ${filtered.length}/${devolucoesCompletas.length} devoluções após todos os filtros (fonte: ${dataSource})`);
    return filtered;
  }, [devolucoesCompletas, dateRange, dataSource]);

  // Enriquecer devoluções com status de análise local
  const devolucoesEnriquecidas = useMemo(() => {
    const enriched = devolucoes.map(dev => ({
      ...dev,
      status_analise_local: analiseStatus[dev.order_id] || 'pendente' as StatusAnalise
    })) as Array<Record<string, any> & { status_analise_local: StatusAnalise }>;
    console.log(`✨ [ENRIQUECIMENTO] ${enriched.length} devoluções enriquecidas com status de análise`);
    return enriched;
  }, [devolucoes, analiseStatus]);

  // Filtrar por aba ativa
  const devolucoesFiltradasPorAba = useMemo(() => {
    const filtered = activeTab === 'ativas'
      ? devolucoesEnriquecidas.filter(dev => STATUS_ATIVOS.includes(dev.status_analise_local))
      : devolucoesEnriquecidas.filter(dev => STATUS_HISTORICO.includes(dev.status_analise_local));
    
    console.log(`📑 [FILTRO ABA] Aba "${activeTab}": ${devolucoesEnriquecidas.length} → ${filtered.length} devoluções`);
    return filtered;
  }, [devolucoesEnriquecidas, activeTab]);

  // Aplicar filtro do resumo
  const devolucoesComFiltroResumo = useMemo(() => {
    if (!filtroResumo) return devolucoesFiltradasPorAba;
    
    const hoje = new Date();
    
    return devolucoesFiltradasPorAba.filter(dev => {
      // Filtro por prazo
      if (filtroResumo.tipo === 'prazo') {
        if (!dev.data_criacao) return false;
        const dataCriacao = parseISO(dev.data_criacao);
        const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
        
        if (filtroResumo.valor === 'vencido') {
          return diasUteis > 3;
        }
        if (filtroResumo.valor === 'a_vencer') {
          return diasUteis >= 0 && diasUteis <= 3;
        }
      }
      
      // Filtro por mediação
      if (filtroResumo.tipo === 'mediacao') {
        return dev.em_mediacao === true;
      }
      
      // Filtro por tipo
      if (filtroResumo.tipo === 'tipo') {
        if (filtroResumo.valor === 'return') {
          return dev.tipo_claim === 'return' || dev.return_id;
        }
        if (filtroResumo.valor === 'cancel') {
          return dev.status_devolucao === 'cancelled' || dev.tipo_claim === 'cancel';
        }
      }
      
      return true;
    });
  }, [devolucoesFiltradasPorAba, filtroResumo]);

  // Paginação dos dados
  const paginatedDevolucoes = useMemo(() => {
    if (itemsPerPage === -1) {
      console.log(`📄 [PAGINAÇÃO] Exibindo TODAS as ${devolucoesComFiltroResumo.length} devoluções`);
      return devolucoesComFiltroResumo;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginated = devolucoesComFiltroResumo.slice(startIndex, startIndex + itemsPerPage);
    console.log(`📄 [PAGINAÇÃO] Página ${currentPage}: exibindo ${paginated.length} de ${devolucoesComFiltroResumo.length} devoluções (${itemsPerPage} por página)`);
    return paginated;
  }, [devolucoesComFiltroResumo, currentPage, itemsPerPage]);

  const filteredCount = devolucoesComFiltroResumo.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredCount / itemsPerPage);

  // ✅ CORREÇÃO 1: Não faz busca automática ao acessar a página
  // - Apenas restaura filtros do cache (linhas 64-74)
  // - Busca só ocorre quando usuário clica em "Aplicar Filtros"

  // ✅ COMBO 2.1: Metadados salvos automaticamente pelo hook unificado

  // Handler para aplicar filtros - força refetch com invalidação de cache
  const handleApplyFilters = useCallback(async () => {
    // ✅ COMBO 2.1: Validar pendingFilters ANTES de aplicar
    if (!pendingFilters.selectedAccounts?.length) {
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }
    
    console.log('🔄 [COMBO 2.1] Aplicando filtros e buscando dados...', {
      pendingAccounts: pendingFilters.selectedAccounts.length,
      appliedAccounts: appliedAccounts.length
    });
    setIsManualSearching(true);
    
    // ✅ COMBO 2.1: Aplicar filtros (muda pendingFilters → appliedFilters)
    applyFiltersInternal();
    setAppliedAccounts(pendingFilters.selectedAccounts);
    
    // 🚀 COMBO 2.1: Habilitar busca (enabled: true)
    setShouldFetch(true);
    
    // ✅ Aguardar próximo tick para garantir que estado foi atualizado
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      // Invalidar TODAS as queries de ml-claims-cache (força nova busca)
      await queryClient.invalidateQueries({ 
        queryKey: ['ml-claims-cache'],
        refetchType: 'all' 
      });
      
      console.log('✅ [COMBO 2.1] Busca disparada');
      toast.success('Buscando dados...');
    } catch (error) {
      console.error('❌ [BUSCA MANUAL] Erro ao buscar devoluções:', error);
      toast.error('Erro ao buscar devoluções');
    } finally {
      setIsManualSearching(false);
    }
  }, [pendingFilters.selectedAccounts, appliedAccounts, queryClient, applyFiltersInternal]);

  const handleCancelSearch = useCallback(() => {
    console.log('🛑 Cancelando busca...');
    queryClient.cancelQueries({ queryKey: ['ml-claims-cache'] });
    setShouldFetch(false); // 🚀 COMBO 2.1: Desabilitar busca
    setIsManualSearching(false);
    toast.info('Busca cancelada');
  }, [queryClient]);

  // Handler para mudança de status de análise
  const handleStatusChange = useCallback((orderId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(orderId, newStatus);
    console.log(`✅ Status de análise atualizado: ${orderId} → ${newStatus}`);
  }, [setAnaliseStatus]);

  // Handler para abrir modal de anotações
  const handleOpenAnotacoes = useCallback((orderId: string) => {
    setSelectedOrderForAnotacoes(orderId);
  }, []);

  // ✅ REMOVIDO: useEffect que resetava isManualSearching (agora é feito no finally do handleApplyFilters)

  // Sistema de Alertas (sobre dados completos)
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoesCompletas);

  // ✅ COMBO 2: Polling é nativo do useMLClaimsFromCache (refetchInterval: 60s)
  // Não precisa de polling separado - React Query gerencia automaticamente

  // FASE 4: Agregação de métricas (sobre dados filtrados)
  const metrics = useDevolucoesAggregator(devolucoes, analiseStatus);

  // Contadores para as abas (usando metrics agregadas)
  const countAtivas = metrics.totalAtivas;
  const countHistorico = metrics.totalHistorico;

  return (
    <div className="w-full">
      <div className="pb-20">
          {/* Sub-navegação */}
          <div className="px-4 md:px-6">
            <MLOrdersNav />
          </div>
          
          {/* Tabs: Ativas vs Histórico + Filtros */}
          <div className="px-4 md:px-6 mt-8">
            <Tabs value={activeTab} onValueChange={(v) => changeTab(v as 'ativas' | 'historico')}>
              <div className="flex items-center gap-3 flex-nowrap">
                <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                  <TabsTrigger 
                    value="ativas" 
                    className="h-10"
                  >
                    Ativas ({countAtivas})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="historico" 
                    className="h-10"
                  >
                    Histórico ({countHistorico})
                  </TabsTrigger>
                </TabsList>
                
                {/* Filtros integrados */}
                <div className="flex-1 min-w-0">
                  <Devolucao2025FilterBar
                      accounts={accounts}
                      selectedAccountIds={pendingFilters.selectedAccounts}
                      onAccountsChange={(accounts) => updateFilter('selectedAccounts', accounts)}
                      startDate={pendingFilters.startDate}
                      endDate={pendingFilters.endDate}
                      onDateRangeChange={updateDateRange}
                      searchTerm={searchTerm}
                      onSearchChange={(term) => updateFilter('searchTerm', term)}
                      onBuscar={handleApplyFilters}
                      isLoading={isManualSearching || isApplying}
                      onCancel={handleCancelSearch}
                      hasPendingChanges={hasPendingChanges}
                      allColumns={COLUMNS_CONFIG}
                      visibleColumns={Array.from(columnManager.state.visibleColumns)}
                      onVisibleColumnsChange={(cols) => columnManager.actions.setVisibleColumns(cols)}
                    />
                </div>
              </div>
            </Tabs>
          </div>

          {/* 📊 Resumo de Métricas - após as abas */}
          <div className="mt-12 px-4 md:px-6">
            <Devolucao2025Resumo 
              devolucoes={devolucoesFiltradasPorAba}
              onFiltroClick={setFiltroResumo}
              filtroAtivo={filtroResumo}
            />
          </div>

          {/* Tabela */}
          <div className="px-4 md:px-6 mt-2 relative">
            <Tabs value={activeTab}>
              <TabsContent value={activeTab} className="mt-0">
                {/* 🔄 LOADER APENAS NA ÁREA DA TABELA */}
                {(isLoading || isManualSearching) && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-[65px] h-[65px]">
                        <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim" />
                        <span className="absolute rounded-[50px] shadow-[inset_0_0_0_3px] shadow-gray-800 dark:shadow-gray-100 animate-loaderAnim [animation-delay:-1.25s]" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Buscando devoluções...</p>
                    </div>
                  </div>
                )}
                
                <Devolucao2025Table 
                  accounts={accounts}
                  devolucoes={paginatedDevolucoes}
                  isLoading={isLoading}
                  error={error}
                  visibleColumns={Array.from(columnManager.state.visibleColumns)}
                  onStatusChange={handleStatusChange}
                  anotacoes={anotacoes}
                  activeTab={activeTab}
                  onOpenAnotacoes={handleOpenAnotacoes}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Espaço para rodapé */}
          <div className="pb-24"></div>

          {/* Rodapé Fixado com Paginação */}
          {!isLoading && !error && devolucoesFiltradasPorAba.length > 0 && (
            <div 
              className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
              } left-0`}
            >
              <Devolucao2025PaginationFooter
                totalItems={filteredCount}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={changePage}
                onItemsPerPageChange={changeItemsPerPage}
                showFirstLastButtons={true}
                pageButtonLimit={5}
              />
            </div>
          )}
        </div>

        {/* Modal de Anotações */}
        {selectedOrderForAnotacoes && (
          <Devolucao2025AnotacoesModal
            open={!!selectedOrderForAnotacoes}
            onOpenChange={(open) => !open && setSelectedOrderForAnotacoes(null)}
            orderId={selectedOrderForAnotacoes}
            currentAnotacao={anotacoes[selectedOrderForAnotacoes] || ''}
            onSave={saveAnotacao}
          />
        )}
    </div>
  );
};
