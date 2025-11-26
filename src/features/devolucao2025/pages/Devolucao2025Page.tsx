/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES DE VENDA
 * Implementação completa com 65 colunas + Sistema de Alertas + Cache Inteligente
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useDevolucoesPolling } from '../hooks/useDevolucoesPolling';
import { useDevolucoesAggregator } from '../hooks/useDevolucoesAggregator';
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
    filters,
    updateFilter,
    updateFilters,
    persistentCache
  } = useDevolucoesFiltersUnified();
  
  const columnManager = useDevolucoesColumnManager();
  
  // 💾 STORAGE DE ANÁLISE (localStorage)
  const {
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    removeDevolucao
  } = useDevolucaoStorage();
  
  // Estados derivados dos filtros
  const selectedAccounts = filters.selectedAccounts;
  const periodo = filters.periodo;
  const searchTerm = filters.searchTerm;
  const currentPage = filters.currentPage;
  const itemsPerPage = filters.itemsPerPage;
  const activeTab = filters.activeTab;
  
  // Estados locais não gerenciados por filtros
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [filtroResumo, setFiltroResumo] = useState<FiltroResumo | null>(null);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [selectedOrderForAnotacoes, setSelectedOrderForAnotacoes] = useState<string | null>(null);
  
  // ✅ Filtros aplicados (só atualizam ao clicar em "Aplicar Filtros")
  const [appliedAccounts, setAppliedAccounts] = useState<string[]>([]);

  // Sincronizar dateRange com periodo (SEMPRE 60 dias no backend)
  const backendDateRange = useMemo(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 60); // Sempre buscar 60 dias
    return { from: inicio, to: hoje };
  }, []);
  
  // DateRange visual para filtro local (baseado em periodo do usuário)
  useEffect(() => {
    // ✅ Se periodo for 60, usar exatamente o mesmo range do backend
    if (periodo === '60') {
      setDateRange(backendDateRange);
    } else {
      const hoje = new Date();
      const inicio = new Date();
      inicio.setDate(hoje.getDate() - parseInt(periodo));
      setDateRange({ from: inicio, to: hoje });
    }
  }, [periodo, backendDateRange]);
  
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

  // ✅ REMOVIDO: shouldFetch causava bloqueio de buscas
  // React Query gerencia automaticamente baseado em enabled + queryKey changes


  // 🚀 BUSCA AGREGADA NO BACKEND (seguindo padrão /pedidos - sem enabled:false)
  const { data: devolucoesCompletas = [], isLoading, error, refetch } = useQuery({
    queryKey: ['devolucoes-2025-completas', backendDateRange, appliedAccounts],
    queryFn: async () => {
      // ✅ Usar appliedAccounts (filtros confirmados pelo usuário)
      const accountIds = appliedAccounts.length > 0 
        ? appliedAccounts 
        : accounts.map(a => a.id).filter(Boolean);
      
      console.log(`🔍 [API] Buscando ${accountIds.length} contas aplicadas no backend...`, accountIds);
      
      const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
        body: {
          integration_account_ids: accountIds,
          date_from: backendDateRange.from.toISOString(),
          date_to: backendDateRange.to.toISOString()
        }
      });

      if (error) {
        console.error('❌ [API] Erro ao buscar:', error);
        throw error;
      }
      
      // ✅ CORREÇÃO: Edge Function retorna { success, data, total }
      const results = Array.isArray(data) ? data : (data?.data || []);
      console.log(`✅ [API] ${results.length} devoluções retornadas da API`);
      console.log('📦 [API] Primeiras 3 devoluções:', results.slice(0, 3));
      return results;
    },
    enabled: appliedAccounts.length > 0, // ✅ Só busca quando há contas aplicadas
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Filtrar localmente baseado nas preferências do usuário
  const devolucoes = useMemo(() => {
    console.log(`🔍 [FILTRO LOCAL] Iniciando com ${devolucoesCompletas.length} devoluções completas`);
    let filtered = devolucoesCompletas;
    
    // Filtro de período (local)
    if (dateRange.from && dateRange.to) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(dev => {
        if (!dev.data_criacao) return false;
        const dataCriacao = parseISO(dev.data_criacao);
        return dataCriacao >= dateRange.from && dataCriacao <= dateRange.to;
      });
      console.log(`📅 [FILTRO PERÍODO] ${beforeFilter} → ${filtered.length} (período: ${dateRange.from.toLocaleDateString()} a ${dateRange.to.toLocaleDateString()})`);
    }
    
    // ✅ Filtro de contas removido - já filtrado no backend via selectedAccounts
    
    console.log(`🎯 [FILTRO LOCAL FINAL] ${filtered.length}/${devolucoesCompletas.length} devoluções após todos os filtros`);
    return filtered;
  }, [devolucoesCompletas, dateRange]);

  // Enriquecer devoluções com status de análise local
  const devolucoesEnriquecidas = useMemo(() => {
    const enriched = devolucoes.map(dev => ({
      ...dev,
      status_analise_local: analiseStatus[dev.order_id] || 'pendente' as StatusAnalise
    }));
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

  // ✅ SALVAR METADADOS (SEM devoluções - evita QuotaExceededError)
  useEffect(() => {
    if (devolucoesCompletas.length > 0 && persistentCache.isStateLoaded) {
      const timer = setTimeout(() => {
        persistentCache.saveDataCache(
          selectedAccounts, // Filtros visuais do usuário
          dateRange,
          currentPage,
          itemsPerPage,
          Array.from(columnManager.state.visibleColumns),
          periodo
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, itemsPerPage, periodo, devolucoesCompletas.length, persistentCache.isStateLoaded]);

  // Handler para aplicar filtros (força refetch dos 60 dias completos)
  const handleApplyFilters = useCallback(async () => {
    console.log('🔄 Aplicando filtros e buscando dados...');
    setIsManualSearching(true);
    
    // ✅ Aplicar os filtros selecionados pelo usuário
    setAppliedAccounts(selectedAccounts);
    
    try {
      // ✅ CORREÇÃO: Como enabled agora é dinâmico, refetch funcionará automaticamente
      await refetch();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('❌ [BUSCA MANUAL] Erro ao buscar devoluções:', error);
      toast.error('Erro ao buscar devoluções');
    } finally {
      setIsManualSearching(false);
    }
  }, [refetch, selectedAccounts]);

  const handleCancelSearch = useCallback(() => {
    console.log('🛑 Cancelando busca...');
    // Cancela a query em andamento
    queryClient.cancelQueries({ queryKey: ['devolucoes-2025-completas'] });
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

  // FASE 4: Polling automático (sobre dados completos)
  // ✅ CORREÇÃO CRÍTICA 4: Simplificar lógica - polling ativo se há dados e não está em loading
  const { forceRefresh, isPolling } = useDevolucoesPolling({
    enabled: devolucoesCompletas.length > 0 && !isLoading && !error,
    interval: 60000, // 1 minuto
    onNewData: (newCount) => {
      toast.success(`${newCount} nova(s) devolução(ões) detectada(s)`, {
        description: 'Os dados foram atualizados automaticamente',
        duration: 5000,
      });
    },
    pauseOnInteraction: true,
  });

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
          
          {/* Header */}
          <div className="px-4 md:px-6 py-3 mt-2">
            <h1 className="text-3xl font-bold">📋 Devoluções de Vendas</h1>
          </div>


          {/* Tabs: Ativas vs Histórico + Filtros */}
          <div className="px-4 md:px-6 mt-2">
            <Tabs value={activeTab} onValueChange={(v) => updateFilter('activeTab', v as 'ativas' | 'historico')}>
              <div className="flex items-center gap-3 flex-nowrap">
                <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                  <TabsTrigger 
                    value="ativas" 
                    className="h-10"
                    onClick={() => updateFilter('activeTab', 'ativas')}
                  >
                    Ativas ({countAtivas})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="historico" 
                    className="h-10"
                    onClick={() => updateFilter('activeTab', 'historico')}
                  >
                    Histórico ({countHistorico})
                  </TabsTrigger>
                </TabsList>
                
                {/* Filtros integrados */}
                <div className="flex-1 min-w-0">
                  <Devolucao2025FilterBar
                    accounts={accounts}
                    selectedAccountIds={selectedAccounts}
                    onAccountsChange={(accounts) => updateFilter('selectedAccounts', accounts)}
                    periodo={periodo}
                    onPeriodoChange={(p) => updateFilter('periodo', p)}
                    searchTerm={searchTerm}
                    onSearchChange={(term) => updateFilter('searchTerm', term)}
                    onBuscar={handleApplyFilters}
                    isLoading={isManualSearching}
                    onCancel={handleCancelSearch}
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
                onPageChange={(page) => updateFilter('currentPage', page)}
                onItemsPerPageChange={(items) => updateFilter('itemsPerPage', items)}
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
