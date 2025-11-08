/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - PÁGINA PRINCIPAL REFATORADA
 * Arquitetura robusta com manager centralizado, cache e persistência
 */

import { useEffect, useMemo, useState } from 'react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useDevolucaoManager } from '@/features/devolucoes-online/hooks/useDevolucaoManager';
import { usePersistentDevolucaoState } from '@/features/devolucoes-online/hooks/usePersistentDevolucaoState';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoFiltersBar } from '@/features/devolucoes-online/components/DevolucaoFiltersBar';
import { DevolucaoAccountSelector } from '@/features/devolucoes-online/components/DevolucaoAccountSelector';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { DevolucaoQuickFilters } from '@/features/devolucoes-online/components/DevolucaoQuickFilters';
import { DevolucaoControlsBar } from '@/features/devolucoes-online/components/DevolucaoControlsBar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function DevolucoesMercadoLivre() {
  // Manager centralizado
  const devolucaoManager = useDevolucaoManager();
  const { state, actions, totalPages, availableMlAccounts } = devolucaoManager;
  
  // Persistência de estado
  const persistentState = usePersistentDevolucaoState();
  
  // Carregar contas ML com nome
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  
  // Estado dos filtros rápidos
  const [filteredByQuickFilter, setFilteredByQuickFilter] = useState<any[]>([]);
  
  // Estado do auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(3600000); // 1 hora padrão
  
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      setAccounts(data || []);
    };
    fetchAccounts();
  }, []);

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

  // Determinar dados para exibição (filtro rápido tem prioridade)
  const displayData = useMemo(() => {
    return filteredByQuickFilter.length > 0 ? filteredByQuickFilter : state.devolucoes;
  }, [filteredByQuickFilter, state.devolucoes]);

  // Handlers para controles
  const handleExport = () => {
    toast.info('Exportação em desenvolvimento');
  };

  const handleClear = () => {
    actions.clearFilters();
    setFilteredByQuickFilter([]);
    toast.success('Dados limpos com sucesso');
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

          {/* Filters */}
          <div className="px-4 md:px-6">
            <DevolucaoFiltersBar 
              filters={{
                search: '',
                status: [],
                dateFrom: null,
                dateTo: null,
                integrationAccountId: state.integrationAccountId,
              }}
              onFiltersChange={(newFilters) => actions.setFilters(newFilters)}
              onReset={actions.clearFilters}
            />
          </div>

          {/* Account Selector */}
          <div className="px-4 md:px-6">
            <DevolucaoAccountSelector 
              accounts={accounts}
              selectedAccountId={state.integrationAccountId}
              onAccountChange={actions.setIntegrationAccountId}
              loading={!accounts.length}
            />
          </div>

          {/* Table */}
          <div className="px-4 md:px-6">
            <DevolucaoTable 
              devolucoes={displayData}
              isLoading={state.loading}
              error={state.error}
            />
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
