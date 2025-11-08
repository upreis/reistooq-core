/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - PÁGINA COM TABS E ANÁLISE
 * Sistema completo com tabs Ativas/Histórico e status de análise
 */

import { useEffect, useMemo, useState } from 'react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useDevolucaoManager } from '@/features/devolucoes-online/hooks/useDevolucaoManager';
import { usePersistentDevolucaoState } from '@/features/devolucoes-online/hooks/usePersistentDevolucaoState';
import { useDevolucaoStorage } from '@/features/devolucoes-online/hooks/useDevolucaoStorage';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoAdvancedFiltersBar } from '@/features/devolucoes-online/components/DevolucaoAdvancedFiltersBar';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { DevolucaoQuickFilters } from '@/features/devolucoes-online/components/DevolucaoQuickFilters';
import { DevolucaoControlsBar } from '@/features/devolucoes-online/components/DevolucaoControlsBar';
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
  
  // Estado do auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(3600000); // 1 hora padrão
  
  // Estados da barra de filtros avançada
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Tab ativa (Ativas/Histórico)
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      setAccounts(data || []);
      
      // Selecionar a primeira conta por padrão (não todas, pois o manager suporta apenas 1)
      if (data && data.length > 0) {
        const firstAccountId = data[0].id;
        setSelectedAccountIds([firstAccountId]);
        actions.setIntegrationAccountId(firstAccountId);
      }
    };
    fetchAccounts();
  }, []);

  // Limpar dados antigos ao montar
  useEffect(() => {
    clearOldData();
  }, [clearOldData]);

  // Restaurar estado persistido
  useEffect(() => {
    if (persistentState.isStateLoaded && persistentState.hasValidPersistedState()) {
      const persisted = persistentState.persistedState!;
      console.log('🔄 Restaurando estado:', persisted.devolucoes.length, 'devoluções');
      
      actions.restorePersistedData(persisted.devolucoes, persisted.total, persisted.currentPage);
      
      if (persisted.integrationAccountId) {
        actions.setIntegrationAccountId(persisted.integrationAccountId);
      }
    }
  }, [persistentState.isStateLoaded]);

  // Salvar dados ao mudar (com debounce automático no manager)
  useEffect(() => {
    if (state.devolucoes.length > 0 && !state.loading) {
      persistentState.saveOrdersData(state.devolucoes, state.total, state.currentPage);
    }
  }, [state.devolucoes, state.total, state.currentPage, state.loading]);

  // Calcular estatísticas (memoizado)
  const stats = useMemo(() => ({
    total: state.total,
    pending: state.devolucoes.filter(d => d.status?.id === 'pending').length,
    approved: state.devolucoes.filter(d => d.status?.id === 'approved').length,
    refunded: state.devolucoes.filter(d => d.status_money?.id === 'refunded').length,
  }), [state.devolucoes, state.total]);

  // Adicionar status de análise e empresa às devoluções
  const devolucoesComAnalise = useMemo(() => {
    const dataToUse = filteredByQuickFilter.length > 0 ? filteredByQuickFilter : state.devolucoes;
    
    return dataToUse.map((dev) => {
      // Encontrar nome da empresa/conta
      const account = accounts.find(acc => acc.id === state.integrationAccountId);
      
      return {
        ...dev,
        status_analise: analiseStatus[dev.id]?.status || ('pendente' as StatusAnalise),
        empresa: account?.name || 'N/A',
      };
    });
  }, [filteredByQuickFilter, state.devolucoes, analiseStatus, accounts, state.integrationAccountId]);

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
    actions.clearFilters();
    setFilteredByQuickFilter([]);
    clearStorage();
    toast.success('Dados limpos com sucesso');
  };

  const handleStatusChange = (devolucaoId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(devolucaoId, newStatus);
    
    // Se mudou para histórico e está na tab ativas, mostrar mensagem
    if (HISTORIC_STATUSES.includes(newStatus) && activeTab === 'ativas') {
      toast.success('Devolução movida para Histórico');
    }
  };

  const handleBuscar = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }

    setIsSearching(true);
    try {
      // Usar a primeira conta selecionada
      const accountId = selectedAccountIds[0];
      console.log('🔍 Buscando devoluções da conta:', accountId);
      
      // Atualizar a conta no manager - isso vai disparar um novo fetch automaticamente
      actions.setIntegrationAccountId(accountId);
      
      // Aguardar um pouco para o SWR processar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (selectedAccountIds.length > 1) {
        toast.info(`Buscando da conta selecionada. Suporte para múltiplas contas em breve.`);
      } else {
        toast.success('Busca iniciada');
      }
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast.error('Erro ao buscar devoluções');
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
          
          {/* Header */}
          <div className="px-4 md:px-6">
            <DevolucaoHeaderSection 
              isRefreshing={state.isRefreshing}
              onRefresh={actions.refetch}
            />
          </div>

          {/* Stats Cards */}
          <div className="px-4 md:px-6">
            <DevolucaoStatsCards stats={stats} />
          </div>

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
                    isLoading={state.loading}
                    error={state.error}
                    onStatusChange={handleStatusChange}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="historico">
                <Card>
                  <DevolucaoTable 
                    devolucoes={devolucoesFiltradas.historico}
                    isLoading={state.loading}
                    error={state.error}
                    onStatusChange={handleStatusChange}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Pagination */}
          <div className="px-4 md:px-6 pb-6">
            <DevolucaoPaginationControls />
          </div>
        </div>
      </div>
    </div>
  );
}
