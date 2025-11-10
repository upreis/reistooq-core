/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - PÁGINA COM TABS E ANÁLISE
 * Sistema completo com tabs Ativas/Histórico e status de análise
 * ✅ SPRINT 1: Alertas de Deadlines Críticos implementados
 */

import { useEffect, useMemo, useState } from 'react';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useDevolucaoManager } from '@/features/devolucoes-online/hooks/useDevolucaoManager';
import { usePersistentDevolucaoState } from '@/features/devolucoes-online/hooks/usePersistentDevolucaoState';
import { useDevolucaoStorage } from '@/features/devolucoes-online/hooks/useDevolucaoStorage';
import type { DevolucaoFilters, MLReturn } from '@/features/devolucoes-online/types/devolucao.types';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoAdvancedFiltersBar } from '@/features/devolucoes-online/components/DevolucaoAdvancedFiltersBar';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { DevolucaoQuickFilters } from '@/features/devolucoes-online/components/DevolucaoQuickFilters';
import { DevolucaoControlsBar } from '@/features/devolucoes-online/components/DevolucaoControlsBar';
import { UrgencyFilters } from '@/features/devolucoes-online/components/filters/UrgencyFilters';
import { CriticalDeadlinesNotification } from '@/features/devolucoes-online/components/notifications/CriticalDeadlinesNotification';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StatusAnalise, STATUS_ATIVOS, STATUS_HISTORICO } from '@/features/devolucoes-online/types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '@/features/devolucoes-online/types/devolucao-analise.types';

export default function DevolucoesMercadoLivre() {
  // Manager centralizado
  const devolucaoManager = useDevolucaoManager();
  const { state, actions, totalPages, availableMlAccounts } = devolucaoManager;
  
  // Persistência de estado
  const persistentState = usePersistentDevolucaoState();
  
  // Storage para status de análise
  const { analiseStatus, setAnaliseStatus, clearOldData, clearStorage } = useDevolucaoStorage();
  
  // Carregar contas ML com nome
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  
  // Estado dos filtros rápidos
  const [filteredByQuickFilter, setFilteredByQuickFilter] = useState<any[]>([]);
  
  // ✅ SPRINT 1: Estado do filtro de urgência
  const [urgencyFilter, setUrgencyFilter] = useState<((dev: MLReturn) => boolean) | null>(null);
  const [currentUrgencyFilter, setCurrentUrgencyFilter] = useState<string>('all');
  
  // Estado do auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(3600000); // 1 hora padrão
  
  // Estados da barra de filtros avançada (restaurados do cache se existir)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasRestoredFromCache, setHasRestoredFromCache] = useState(false);
  
  // Tab ativa (Ativas/Histórico)
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  
  // ✅ PRIMEIRO: Restaurar cache IMEDIATAMENTE (síncrono)
  useEffect(() => {
    if (!persistentState.isStateLoaded || hasRestoredFromCache) return;
    
    if (persistentState.hasValidPersistedState()) {
      const cached = persistentState.persistedState;
      if (!cached) return;
      
      console.log('⚡ RESTAURAÇÃO INSTANTÂNEA do cache:', {
        devolucoes: cached.devolucoes?.length || 0,
        total: cached.total,
        cacheAge: cached.cachedAt ? `${Math.round((Date.now() - new Date(cached.cachedAt).getTime()) / 1000)}s` : 'N/A',
      });
      
      // ✅ Restaurar dados PRIMEIRO (sem loading)
      if (cached.devolucoes && cached.devolucoes.length > 0) {
        actions.restorePersistedData(cached.devolucoes, cached.total, cached.currentPage);
      }
      
      // ✅ Restaurar contas
      if (cached.integrationAccountId) {
        const accountIds = cached.integrationAccountId.includes(',') 
          ? cached.integrationAccountId.split(',')
          : [cached.integrationAccountId];
        
        setSelectedAccountIds(accountIds);
        
        // Sincronizar com manager
        if (accountIds.length > 1) {
          actions.setMultipleAccounts(accountIds);
        } else {
          actions.setIntegrationAccountId(accountIds[0]);
        }
      }
      
      // ✅ Restaurar filtros UI
      if (cached.filters) {
        if (cached.filters.search) setSearchTerm(cached.filters.search);
        if (cached.filters.dateFrom && cached.filters.dateTo) {
          const diffDays = Math.round(
            (new Date(cached.filters.dateTo).getTime() - 
             new Date(cached.filters.dateFrom).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          setPeriodo(diffDays.toString());
        }
      }
      
      setHasRestoredFromCache(true);
      toast.success('Dados restaurados', { duration: 2000 });
    }
  }, [persistentState.isStateLoaded, hasRestoredFromCache]);
  
  // ✅ SEGUNDO: Carregar contas do banco (assíncrono)
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      setAccounts(data || []);
      
      // ✅ PRIMEIRA VEZ (sem cache): apenas selecionar contas
      if (data && data.length > 0 && !hasRestoredFromCache && !persistentState.hasValidPersistedState()) {
        const allAccountIds = data.map(acc => acc.id);
        setSelectedAccountIds(allAccountIds);
        
        if (allAccountIds.length > 1) {
          actions.setMultipleAccounts(allAccountIds);
        } else {
          actions.setIntegrationAccountId(allAccountIds[0]);
        }
        
        setHasRestoredFromCache(true);
      }
    };
    
    if (persistentState.isStateLoaded) {
      fetchAccounts();
    }
  }, [persistentState.isStateLoaded]);


  // ✅ FIX: Limpar dados antigos APENAS na montagem inicial
  // Usar useEffect vazio para evitar loop infinito
  useEffect(() => {
    clearOldData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Salvar dados quando mudar (mas só se não estiver restaurando)
  useEffect(() => {
    if (state.devolucoes.length > 0 && !state.loading && hasRestoredFromCache) {
      const accountKey = selectedAccountIds.length > 1 
        ? selectedAccountIds.sort().join(',')
        : selectedAccountIds[0] || '';
      
      persistentState.saveOrdersData(state.devolucoes, state.total, state.currentPage);
      persistentState.saveIntegrationAccountId(accountKey);
      
      console.log('💾 Estado persistido salvo:', {
        devolucoes: state.devolucoes.length,
        total: state.total,
        page: state.currentPage,
        accounts: accountKey,
      });
    }
  }, [state.devolucoes, state.total, state.currentPage, state.loading, hasRestoredFromCache, selectedAccountIds]);

  // Calcular estatísticas (memoizado)
  const stats = useMemo(() => ({
    total: state.total,
    pending: state.devolucoes.filter(d => d.status?.id === 'pending').length,
    approved: state.devolucoes.filter(d => d.status?.id === 'approved').length,
    refunded: state.devolucoes.filter(d => d.status_money?.id === 'refunded').length,
  }), [state.devolucoes, state.total]);

  // ✅ FIX: Usar timestamp para forçar re-render quando status mudar
  const [analiseUpdateTrigger, setAnaliseUpdateTrigger] = useState(0);
  
  // ✅ SPRINT 1: Aplicar filtro de urgência PRIMEIRO, depois status de análise
  const devolucoesComUrgencyFilter = useMemo(() => {
    const dataToUse = filteredByQuickFilter.length > 0 ? filteredByQuickFilter : state.devolucoes;
    
    // Aplicar filtro de urgência se houver
    if (urgencyFilter) {
      return dataToUse.filter(urgencyFilter);
    }
    
    return dataToUse;
  }, [filteredByQuickFilter, state.devolucoes, urgencyFilter]);
  
  // Adicionar status de análise e empresa às devoluções (após filtro de urgência)
  const devolucoesComAnalise = useMemo(() => {
    return devolucoesComUrgencyFilter.map((dev: any) => {
      const accountId = dev.integration_account_id;
      const account = accounts.find(acc => acc.id === accountId);
      const empresaNome = account?.name || 'N/A';
      
      return {
        ...dev,
        status_analise: analiseStatus[dev.id]?.status || ('pendente' as StatusAnalise),
        empresa: empresaNome,
      };
    });
  }, [devolucoesComUrgencyFilter, analiseStatus, accounts, analiseUpdateTrigger]);

  // Separar em Ativas e Histórico
  const devolucoesFiltradas = useMemo(() => {
    const ativas = devolucoesComAnalise.filter((dev) =>
      ACTIVE_STATUSES.includes(dev.status_analise)
    );
    const historico = devolucoesComAnalise.filter((dev) =>
      HISTORIC_STATUSES.includes(dev.status_analise)
    );
    
    return { ativas, historico };
  }, [devolucoesComAnalise]);

  // Handlers para controles
  const handleExport = () => {
    toast.info('Exportação em desenvolvimento');
  };

  const handleClear = () => {
    // ✅ FIX: Limpar TUDO incluindo dados do manager
    actions.clearFilters();
    actions.restorePersistedData([], 0, 1); // ✅ Limpar dados do manager
    setFilteredByQuickFilter([]);
    clearStorage(); // Limpar status de análise
    persistentState.clearPersistedState(); // Limpar cache
    
    // Resetar UI
    setSearchTerm('');
    setPeriodo('60');
    setSelectedAccountIds(accounts.map(acc => acc.id));
    
    toast.success('Todos os dados foram removidos. Clique em "Buscar" para carregar novamente.');
  };

  const handleStatusChange = (devolucaoId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(devolucaoId, newStatus);
    setAnaliseUpdateTrigger(prev => prev + 1); // ✅ FIX: Disparar re-render
    
    if (HISTORIC_STATUSES.includes(newStatus) && activeTab === 'ativas') {
      toast.success('Devolução movida para Histórico');
    }
  };

  const handleBuscar = async () => {
    // Prevenir múltiplos cliques
    if (isSearching || state.loading) {
      console.warn('⚠️ Busca já em andamento, ignorando clique');
      return;
    }

    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }

    setIsSearching(true);
    try {
      // ✅ Calcular datas usando date-fns (exatamente como /reclamacoes)
      const days = parseInt(periodo);
      const hoje = new Date();
      const dataInicio = startOfDay(subDays(hoje, days)); // 00:00:00 de X dias atrás
      const dataFim = endOfDay(hoje); // 23:59:59 de hoje
      
      // ✅ Converter para formato YYYY-MM-DD (extraindo apenas a data)
      const dateFromISO = format(dataInicio, 'yyyy-MM-dd');
      const dateToISO = format(dataFim, 'yyyy-MM-dd');
      
      console.log('📅 Aplicando filtros de data (ISO strings):', {
        periodo: `${days} dias`,
        dateFrom: dateFromISO,
        dateTo: dateToISO,
        dateFromFull: dataInicio.toISOString(),
        dateToFull: dataFim.toISOString(),
      });
      
      // ✅ Aplicar filtros de data como strings YYYY-MM-DD
      const newFilters: Partial<DevolucaoFilters> = {
        dateFrom: dateFromISO,  // ✅ String format YYYY-MM-DD
        dateTo: dateToISO,      // ✅ String format YYYY-MM-DD
        search: searchTerm,
      };
      
      actions.setFilters(newFilters);
      
      // ✅ Salvar filtros aplicados (criar objeto completo)
      persistentState.saveAppliedFilters({
        ...newFilters,
        status: [],
        integrationAccountId: selectedAccountIds.length === 1 ? selectedAccountIds[0] : selectedAccountIds.join(','),
      } as DevolucaoFilters);
      
      if (selectedAccountIds.length === 1) {
        // Busca de conta única
        console.log('🔍 Buscando devoluções da conta:', selectedAccountIds[0]);
        actions.setIntegrationAccountId(selectedAccountIds[0]);
        persistentState.saveIntegrationAccountId(selectedAccountIds[0]);
      } else {
        // Busca de múltiplas contas
        console.log('🔍 Buscando devoluções de', selectedAccountIds.length, 'contas:', selectedAccountIds);
        actions.setMultipleAccounts(selectedAccountIds);
        const accountsKey = selectedAccountIds.sort().join(',');
        persistentState.saveIntegrationAccountId(accountsKey);
      }
      
      const contasTexto = selectedAccountIds.length === 1 
        ? 'conta selecionada' 
        : `${selectedAccountIds.length} contas selecionadas`;
      
      toast.loading(`Buscando devoluções de ${contasTexto} - Últimos ${days} dias...`, {
        id: 'buscar-devolucoes',
      });
      
      // Forçar refetch imediato
      await actions.refetch();
      
      toast.success(`Busca concluída!`, {
        id: 'buscar-devolucoes',
      });
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error('Erro ao buscar devoluções', {
        id: 'buscar-devolucoes',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    toast.info('Busca cancelada');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto m-0">
        <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Header com Notificação de Críticos */}
          <div className="px-4 md:px-6">
            <div className="flex items-center justify-between">
              <DevolucaoHeaderSection 
                isRefreshing={state.isRefreshing}
                onRefresh={actions.refetch}
              />
              {/* ✅ SPRINT 1: Notificação de Deadlines Críticos */}
              <CriticalDeadlinesNotification 
                devolucoes={state.devolucoes}
                onClick={() => {
                  // Ativar filtro de críticos
                  setCurrentUrgencyFilter('critical');
                  setUrgencyFilter((dev: MLReturn) => {
                    const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
                    const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
                    return (shipmentHours !== null && shipmentHours < 24) ||
                           (reviewHours !== null && reviewHours < 24);
                  });
                  toast.info('Mostrando apenas devoluções críticas');
                }}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-4 md:px-6">
            <DevolucaoStatsCards stats={stats} />
          </div>

          {/* ✅ SPRINT 1: Filtros de Urgência */}
          {state.devolucoes.length > 0 && (
            <div className="px-4 md:px-6">
              <UrgencyFilters 
                devolucoes={state.devolucoes}
                onFilterChange={setUrgencyFilter}
                currentFilter={currentUrgencyFilter}
                onCurrentFilterChange={setCurrentUrgencyFilter}
              />
            </div>
          )}

          {/* Quick Filters + Controls */}
          {state.devolucoes.length > 0 && (
            <div className="px-4 md:px-6">
              <DevolucaoQuickFilters 
                devolucoes={state.devolucoes}
                onFilteredDataChange={setFilteredByQuickFilter}
              />
            </div>
          )}

          {/* Controls Bar */}
          <div className="px-4 md:px-6 flex justify-end">
            <DevolucaoControlsBar 
              autoRefreshEnabled={autoRefreshEnabled}
              autoRefreshInterval={autoRefreshInterval}
              onAutoRefreshToggle={setAutoRefreshEnabled}
              onAutoRefreshIntervalChange={setAutoRefreshInterval}
              onExport={handleExport}
              onClear={handleClear}
              onRefresh={actions.refetch}
              totalRecords={state.total}
              isRefreshing={state.isRefreshing}
            />
          </div>

          {/* Filters Avançados */}
          <div className="px-4 md:px-6">
            <DevolucaoAdvancedFiltersBar 
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              onAccountsChange={setSelectedAccountIds}
              periodo={periodo}
              onPeriodoChange={setPeriodo}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onBuscar={handleBuscar}
              isLoading={isSearching}
              onCancel={handleCancelSearch}
            />
          </div>

          {/* Tabs Ativas/Histórico */}
          <div className="px-4 md:px-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
              <TabsList className="mb-4">
                <TabsTrigger value="ativas">
                  Ativas ({devolucoesFiltradas.ativas.length})
                </TabsTrigger>
                <TabsTrigger value="historico">
                  Histórico ({devolucoesFiltradas.historico.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ativas">
                <Card>
                  <DevolucaoTable 
                    devolucoes={devolucoesFiltradas.ativas}
                    isLoading={state.loading && state.devolucoes.length === 0}
                    error={state.error}
                    onStatusChange={handleStatusChange}
                    onRefresh={() => window.location.reload()}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card>
                  <DevolucaoTable 
                    devolucoes={devolucoesFiltradas.historico}
                    isLoading={state.loading && state.devolucoes.length === 0}
                    error={state.error}
                    onStatusChange={handleStatusChange}
                    onRefresh={() => window.location.reload()}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 md:px-6 pb-6">
              <DevolucaoPaginationControls 
                currentPage={state.currentPage}
                totalPages={totalPages}
                onPageChange={actions.setPage}
                isLoading={state.loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
