/**
 * 📋 PÁGINA PRINCIPAL - DEVOLUÇÕES DE VENDA
 * Implementação completa com 65 colunas + Sistema de Alertas + Cache Inteligente
 */

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export const Devolucao2025Page = () => {
  const { isSidebarCollapsed } = useSidebarUI();
  
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
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Sincronizar dateRange com periodo quando periodo mudar
  useEffect(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - parseInt(periodo));
    setDateRange({ from: inicio, to: hoje });
  }, [periodo]);
  
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

  // Buscar devoluções via Edge Function
  const { data: devolucoes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['devolucoes-2025', selectedAccounts, dateRange],
    queryFn: async () => {
      console.log('🔍 Buscando devoluções...', { selectedAccounts, dateRange });
      let result: any[] = [];
      
      // Se nenhuma conta selecionada ou todas selecionadas
      const accountsToFetch = selectedAccounts.length === 0 || selectedAccounts.length === accounts.length
        ? accounts.map(acc => acc.id)
        : selectedAccounts;
      
      const allDevolucoes = await Promise.all(
        accountsToFetch.map(async (accountId) => {
          const { data, error } = await supabase.functions.invoke('get-devolucoes-direct', {
            body: {
              integration_account_id: accountId,
              date_from: dateRange.from.toISOString(),
              date_to: dateRange.to.toISOString()
            }
          });

          if (error) throw error;
          return data?.data || [];
        })
      );
      result = allDevolucoes.flat();

      // Salvar dados no cache após busca bem-sucedida
      persistentCache.saveDataCache(
        result,
        selectedAccounts,
        dateRange,
        currentPage,
        itemsPerPage,
        Array.from(columnManager.state.visibleColumns),
        periodo
      );

      return result;
    },
    enabled: organizationId !== null && shouldFetch,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados considerados "frescos"
    gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache do React Query
    // Inicializar com dados do localStorage se disponíveis
    initialData: () => {
      if (persistentCache.hasValidPersistedState()) {
        console.log('📦 Iniciando com dados do cache:', persistentCache.persistedState?.devolucoes.length);
        return persistentCache.persistedState?.devolucoes;
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      return persistentCache.persistedState?.cachedAt || 0;
    }
  });

  // Enriquecer devoluções com status de análise local
  const devolucoesEnriquecidas = useMemo(() => {
    return devolucoes.map(dev => ({
      ...dev,
      status_analise_local: analiseStatus[dev.order_id] || 'pendente' as StatusAnalise
    }));
  }, [devolucoes, analiseStatus]);

  // Filtrar por aba ativa
  const devolucoesFiltradasPorAba = useMemo(() => {
    if (activeTab === 'ativas') {
      return devolucoesEnriquecidas.filter(dev => 
        STATUS_ATIVOS.includes(dev.status_analise_local)
      );
    } else {
      return devolucoesEnriquecidas.filter(dev => 
        STATUS_HISTORICO.includes(dev.status_analise_local)
      );
    }
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

  // Paginação dos dados (com filtro para remover linhas sem comprador ou produto)
  const paginatedDevolucoes = useMemo(() => {
    // Filtrar devoluções sem comprador ou produto
    const filteredDevolucoes = devolucoesComFiltroResumo.filter(dev => 
      dev.comprador_nome_completo && dev.produto_titulo
    );
    
    if (itemsPerPage === -1) return filteredDevolucoes; // "Todas"
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDevolucoes.slice(startIndex, startIndex + itemsPerPage);
  }, [devolucoesComFiltroResumo, currentPage, itemsPerPage]);

  const filteredCount = useMemo(() => 
    devolucoesComFiltroResumo.filter(dev => dev.comprador_nome_completo && dev.produto_titulo).length, 
    [devolucoesComFiltroResumo]
  );
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredCount / itemsPerPage);

  // ✅ CORREÇÃO 1: Não faz busca automática ao acessar a página
  // - Apenas restaura filtros do cache (linhas 64-74)
  // - Busca só ocorre quando usuário clica em "Aplicar Filtros"

  // ✅ CORREÇÃO MÉDIA 5: Otimizar dependencies para evitar saves excessivos
  useEffect(() => {
    if (devolucoes.length > 0 && persistentCache.isStateLoaded) {
      const timer = setTimeout(() => {
        persistentCache.saveDataCache(
          devolucoes,
          selectedAccounts,
          dateRange,
          currentPage,
          itemsPerPage,
          Array.from(columnManager.state.visibleColumns),
          periodo
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
    // Apenas triggerar quando valores realmente mudam (não incluir objetos/arrays diretamente)
  }, [currentPage, itemsPerPage, periodo, devolucoes.length, persistentCache.isStateLoaded]);

  // Handler para aplicar filtros (apenas ativa flag)
  const handleApplyFilters = useCallback(() => {
    console.log('🔄 Aplicando filtros, limpando cache...');
    persistentCache.clearPersistedState();
    setShouldFetch(true); // Ativa flag - useEffect vai disparar refetch
  }, [persistentCache]);

  // ✅ CORREÇÃO 2: Cancelar busca sem reload
  const handleCancelSearch = useCallback(() => {
    setIsManualSearching(false);
    setShouldFetch(false); // Desabilitar busca
  }, []);

  // Handler para mudança de status de análise
  const handleStatusChange = useCallback((orderId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(orderId, newStatus);
    console.log(`✅ Status de análise atualizado: ${orderId} → ${newStatus}`);
  }, [setAnaliseStatus]);

  // ✅ Dispara refetch quando shouldFetch é ativado
  useEffect(() => {
    if (shouldFetch && organizationId) {
      console.log('🚀 Disparando busca via shouldFetch=true');
      refetch();
    }
  }, [shouldFetch, organizationId, refetch]);

  // Resetar shouldFetch após busca completar
  useEffect(() => {
    if (!isLoading && shouldFetch) {
      setShouldFetch(false);
      setIsManualSearching(false);
      console.log('✅ Busca concluída, resetando shouldFetch');
    }
  }, [isLoading, shouldFetch]);

  // Sistema de Alertas
  const { alerts, totalAlerts, alertsByType } = useDevolucaoAlerts(devolucoes);

  // FASE 4: Polling automático
  // ✅ CORREÇÃO CRÍTICA 4: Simplificar lógica - polling ativo se há dados e não está em loading
  const { forceRefresh, isPolling } = useDevolucoesPolling({
    enabled: devolucoes.length > 0 && !isLoading && !error, // Polling ativo se já tem dados carregados
    interval: 60000, // 1 minuto
    onNewData: (newCount) => {
      toast.success(`${newCount} nova(s) devolução(ões) detectada(s)`, {
        description: 'Os dados foram atualizados automaticamente',
        duration: 5000,
      });
    },
    pauseOnInteraction: true,
  });

  // FASE 4: Agregação de métricas
  const metrics = useDevolucoesAggregator(devolucoes, analiseStatus);

  // Contadores para as abas (usando metrics agregadas)
  const countAtivas = metrics.totalAtivas;
  const countHistorico = metrics.totalHistorico;

  return (
    <div className="w-full">
      <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header - sem py, apenas px */}
          <div className="px-4 md:px-6">
            <h1 className="text-3xl font-bold">📋 Devoluções de Vendas</h1>
          </div>
          
          {/* Tabs: Ativas vs Histórico + Filtros */}
          <div className="px-4 md:px-6 space-y-4">
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
                    onBuscar={() => {
                      setIsManualSearching(true);
                      handleApplyFilters();
                    }}
                    isLoading={isManualSearching}
                    onCancel={() => {
                      setIsManualSearching(false);
                      handleCancelSearch();
                    }}
                    allColumns={COLUMNS_CONFIG}
                    visibleColumns={Array.from(columnManager.state.visibleColumns)}
                    onVisibleColumnsChange={(cols) => columnManager.actions.setVisibleColumns(cols)}
                  />
                </div>
              </div>
            </Tabs>
            
            {/* Resumo com badges clicáveis - mt-12 após as abas */}
            <div className="mt-12">
              <Devolucao2025Resumo 
                devolucoes={devolucoesFiltradasPorAba}
                onFiltroClick={setFiltroResumo}
                filtroAtivo={filtroResumo}
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="px-4 md:px-6 pb-24"> {/* pb-24 para espaço do rodapé */}
            {isLoading && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Buscando devoluções...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Aguarde enquanto carregamos os dados do Mercado Livre
                  </p>
                </div>
              </div>
            )}
            
            <TabsContent value={activeTab} className="mt-2">
              <Devolucao2025Table 
                accounts={accounts}
                devolucoes={paginatedDevolucoes}
                isLoading={isLoading}
                error={error}
                visibleColumns={Array.from(columnManager.state.visibleColumns)}
                onStatusChange={handleStatusChange}
                anotacoes={anotacoes}
                activeTab={activeTab}
              />
            </TabsContent>
          </div>

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
    </div>
  );
};
