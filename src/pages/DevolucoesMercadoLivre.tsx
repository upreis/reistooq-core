/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - PÁGINA PRINCIPAL REFATORADA
 * Arquitetura robusta com manager centralizado, cache e persistência
 */

import { useEffect, useMemo, useState } from 'react';
import { OMSNav } from '@/features/oms/components/OMSNav';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { useDevolucaoManager } from '@/features/devolucoes-online/hooks/useDevolucaoManager';
import { usePersistentDevolucaoState } from '@/features/devolucoes-online/hooks/usePersistentDevolucaoState';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoFiltersBar } from '@/features/devolucoes-online/components/DevolucaoFiltersBar';
import { DevolucaoAccountSelector } from '@/features/devolucoes-online/components/DevolucaoAccountSelector';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { supabase } from '@/integrations/supabase/client';

export default function DevolucoesMercadoLivre() {
  // Manager centralizado
  const devolucaoManager = useDevolucaoManager();
  const { state, actions, totalPages, availableMlAccounts } = devolucaoManager;
  
  // Persistência de estado
  const persistentState = usePersistentDevolucaoState();
  
  // Carregar contas ML com nome
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  
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

  return (
    <div className="min-h-screen bg-background">
      <OMSNav />
      <MLOrdersNav />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <DevolucaoHeaderSection 
          isRefreshing={state.isRefreshing}
          onRefresh={actions.refetch}
        />

        {/* Stats Cards */}
        <DevolucaoStatsCards stats={stats} />

        {/* Account Selector */}
        <DevolucaoAccountSelector 
          accounts={accounts}
          selectedAccountId={state.integrationAccountId}
          onAccountChange={actions.setIntegrationAccountId}
          loading={!accounts.length}
        />

        {/* Filters */}
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

        {/* Table */}
        <DevolucaoTable 
          devolucoes={state.devolucoes}
          isLoading={state.loading}
          error={state.error}
        />

        {/* Pagination */}
        <DevolucaoPaginationControls />
      </div>
    </div>
  );
}
