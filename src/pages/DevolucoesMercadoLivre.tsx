/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - PÁGINA REFATORADA (FASE 5)
 * ✅ Migrado de SWR para React Query
 * ✅ Mantém funcionalidade idêntica
 * ✅ Adiciona UI de sincronização
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { DevolucaoProvider, useDevolucaoContext } from '@/features/devolucoes-online/contexts/DevolucaoProvider';
import { 
  useGetDevolucoes,
  useSyncDevolucoes,
  useSyncStatus,
  useAutoEnrichment
} from '@/features/devolucoes-online/hooks';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoAdvancedFiltersBar } from '@/features/devolucoes-online/components/DevolucaoAdvancedFiltersBar';
import { DevolucaoPaginationControls } from '@/features/devolucoes-online/components/DevolucaoPaginationControls';
import { DevolucaoQuickFilters } from '@/features/devolucoes-online/components/DevolucaoQuickFilters';
import { DevolucaoControlsBar } from '@/features/devolucoes-online/components/DevolucaoControlsBar';
import { UrgencyFilters } from '@/features/devolucoes-online/components/filters/UrgencyFilters';
import { CriticalDeadlinesNotification } from '@/features/devolucoes-online/components/notifications/CriticalDeadlinesNotification';
import { SyncStatusIndicator } from '@/features/devolucoes-online/components/sync/SyncStatusIndicator';
import { SchemaValidationPanel } from '@/features/devolucoes-online/components/SchemaValidationPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { Database, List } from 'lucide-react';
import type { StatusAnalise } from '@/features/devolucoes-online/types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '@/features/devolucoes-online/types/devolucao-analise.types';

function DevolucoesMercadoLivreContent() {
  const { filters, setFilters, pagination, setPagination, viewMode, setViewMode } = useDevolucaoContext();
  
  // Carregar contas ML
  const [accounts, setAccounts] = React.useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>([]);
  
  // Filtros UI
  const [periodo, setPeriodo] = React.useState('60');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [urgencyFilter, setUrgencyFilter] = React.useState<((dev: any) => boolean) | null>(null);
  const [currentUrgencyFilter, setCurrentUrgencyFilter] = React.useState<string>('all');
  
  // Auto-refresh
  const [autoRefreshEnabled, setAutoRefreshEnabled] = React.useState(false);
  
  // ✅ REACT QUERY: Buscar devoluções
  const { 
    data: devolucoesData, 
    isLoading, 
    error,
    refetch 
  } = useGetDevolucoes(
    {
      integrationAccountId: selectedAccountIds.join(','),
      search: filters.search,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    pagination,
    {
      includeStats: true,
      enabled: selectedAccountIds.length > 0,
      refetchInterval: autoRefreshEnabled ? 30000 : undefined,
    }
  );
  
  // ✅ REACT QUERY: Sync status
  const { data: syncStatus } = useSyncStatus(
    selectedAccountIds[0] || '',
    { enabled: selectedAccountIds.length > 0 }
  );
  
  // ✅ MUTATION: Sincronizar com API antes de buscar
  const syncMutation = useSyncDevolucoes();

  // 🤖 Auto-enriquecimento: detecta dados faltantes e dispara em background
  useAutoEnrichment({
    integrationAccountId: selectedAccountIds[0] || '',
    enabled: selectedAccountIds.length > 0 && !isLoading,
    data: devolucoesData?.data || [],
  });

  // Carregar contas na montagem
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      setAccounts(data || []);
      
      // Selecionar todas por padrão
      if (data && data.length > 0) {
        const allIds = data.map(acc => acc.id);
        setSelectedAccountIds(allIds);
      }
    };
    
    fetchAccounts();
  }, []);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const devolucoes = devolucoesData?.data || [];
    return {
      total: devolucoesData?.pagination?.total || 0,
      pending: devolucoes.filter(d => d.status?.id === 'pending').length,
      approved: devolucoes.filter(d => d.status?.id === 'approved').length,
      refunded: devolucoes.filter(d => d.status_money?.id === 'refunded').length,
    };
  }, [devolucoesData]);

  // Aplicar filtro de urgência
  const devolucoesComUrgencyFilter = useMemo(() => {
    const devolucoes = devolucoesData?.data || [];
    
    if (urgencyFilter) {
      return devolucoes.filter(urgencyFilter);
    }
    
    return devolucoes;
  }, [devolucoesData, urgencyFilter]);

  // Adicionar empresa às devoluções
  const devolucoesComEmpresa = useMemo(() => {
    return devolucoesComUrgencyFilter.map((dev: any) => {
      const account = accounts.find(acc => acc.id === dev.integration_account_id);
      return {
        ...dev,
        empresa: account?.name || 'N/A',
      };
    });
  }, [devolucoesComUrgencyFilter, accounts]);

  // Separar por tabs (ativas/histórico)
  const devolucoesFiltradas = useMemo(() => {
    const ativas = devolucoesComEmpresa.filter((dev) =>
      ACTIVE_STATUSES.includes(dev.status_analise || 'pendente')
    );
    const historico = devolucoesComEmpresa.filter((dev) =>
      HISTORIC_STATUSES.includes(dev.status_analise || 'pendente')
    );
    
    return { ativas, historico };
  }, [devolucoesComEmpresa]);

  // Handlers
  const handleBuscar = async (fullSync: boolean = false) => {
    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }

    try {
      // 1️⃣ Configurar filtros
      const days = parseInt(periodo);
      const hoje = new Date();
      const dataInicio = startOfDay(subDays(hoje, days));
      const dataFim = endOfDay(hoje);
      const dateFromISO = format(dataInicio, 'yyyy-MM-dd');
      const dateToISO = format(dataFim, 'yyyy-MM-dd');

      setFilters({
        integrationAccountId: selectedAccountIds.join(','),
        search: searchTerm,
        dateFrom: dateFromISO,
        dateTo: dateToISO,
      });
      
      setPagination({ ...pagination, page: 1 });

      // 2️⃣ Sincronizar dados da API ML
      const syncType = fullSync ? 'completa (últimos 90 dias)' : 'rápida (incremental)';
      toast.loading(`🔄 Sincronização ${syncType}...`, { id: 'sync-search' });
      
      // Sincronizar para cada conta selecionada
      for (const accountId of selectedAccountIds) {
        await syncMutation.mutateAsync({
          integrationAccountId: accountId,
          batchSize: 100,
          incremental: !fullSync, // ✅ Inverso: fullSync=true → incremental=false
        });
      }

      toast.success(`✅ Sincronização ${syncType} concluída!`, { id: 'sync-search' });

      // 3️⃣ Buscar dados do banco com filtros
      const result = await refetch();
      if (result.isError) {
        toast.error('Erro ao buscar devoluções');
      } else {
        toast.dismiss('sync-search');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar dados da API', { id: 'sync-search' });
    }
  };

  // ❌ REMOVIDO: Sincronização manual - agora acontece via cron job automático
  // O cron job executa sync-devolucoes com sync_all: true a cada hora

  const handleExport = () => {
    toast.info('Exportação em desenvolvimento');
  };

  const handleClear = () => {
    setFilters({});
    setPagination({ page: 1, limit: 50, sortBy: 'data_criacao_claim', sortOrder: 'desc' });
    setSearchTerm('');
    setPeriodo('60');
    setSelectedAccountIds(accounts.map(acc => acc.id));
    setUrgencyFilter(null);
    setCurrentUrgencyFilter('all');
    
    toast.success('Filtros limpos');
  };

  const handleStatusChange = (devolucaoId: string, newStatus: StatusAnalise) => {
    // TODO: Implementar atualização de status via mutation
    toast.info('Atualização de status em desenvolvimento');
  };

  const totalPages = Math.ceil((devolucoesData?.pagination?.total || 0) / pagination.limit!);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto m-0">
        <div className="space-y-6">
          {/* Sub-navegação */}
          <MLOrdersNav />
          
          {/* Tabs: Devoluções vs Schema Validation */}
          <div className="px-4 md:px-6">
            <Tabs defaultValue="devolucoes" className="w-full">
              <TabsList>
                <TabsTrigger value="devolucoes">
                  <List className="h-4 w-4 mr-2" />
                  Devoluções
                </TabsTrigger>
                <TabsTrigger value="validation">
                  <Database className="h-4 w-4 mr-2" />
                  Validação de Schema
                </TabsTrigger>
              </TabsList>

              {/* Tab: Devoluções */}
              <TabsContent value="devolucoes" className="space-y-6 mt-6">
                {/* Header com Notificação */}
                <div className="flex items-center justify-between gap-4">
                  <DevolucaoHeaderSection 
                    isRefreshing={isLoading}
                    onRefresh={() => refetch()}
                  />
                  
                  <CriticalDeadlinesNotification 
                    devolucoes={devolucoesData?.data || []}
                    onClick={() => {
                      setCurrentUrgencyFilter('critical');
                      setUrgencyFilter((dev: any) => {
                        const shipmentHours = dev.deadlines?.shipment_deadline_hours_left;
                        const reviewHours = dev.deadlines?.seller_review_deadline_hours_left;
                        return (shipmentHours !== null && shipmentHours < 24) ||
                               (reviewHours !== null && reviewHours < 24);
                      });
                      toast.info('Mostrando apenas devoluções críticas');
                    }}
                  />
                </div>

                {/* Stats Cards */}
                <DevolucaoStatsCards stats={stats} />

                {/* Filtros de Urgência */}
                {(devolucoesData?.data?.length || 0) > 0 && (
                  <UrgencyFilters 
                    devolucoes={devolucoesData?.data || []}
                    onFilterChange={setUrgencyFilter}
                    currentFilter={currentUrgencyFilter}
                    onCurrentFilterChange={setCurrentUrgencyFilter}
                  />
                )}

                {/* Quick Filters */}
                {(devolucoesData?.data?.length || 0) > 0 && (
                  <DevolucaoQuickFilters 
                    devolucoes={devolucoesData?.data || []}
                    onFilteredDataChange={() => {}}
                  />
                )}

                {/* Controls Bar */}
                <div className="flex justify-end">
                  <DevolucaoControlsBar 
                    autoRefreshEnabled={autoRefreshEnabled}
                    autoRefreshInterval={30000}
                    onAutoRefreshToggle={setAutoRefreshEnabled}
                    onAutoRefreshIntervalChange={() => {}}
                    onExport={handleExport}
                    onClear={handleClear}
                    onRefresh={() => refetch()}
                    totalRecords={devolucoesData?.pagination?.total || 0}
                    isRefreshing={isLoading}
                  />
                </div>

                {/* Filters Avançados */}
                <DevolucaoAdvancedFiltersBar 
                  accounts={accounts}
                  selectedAccountIds={selectedAccountIds}
                  onAccountsChange={setSelectedAccountIds}
                  periodo={periodo}
                  onPeriodoChange={setPeriodo}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onBuscar={handleBuscar}
                  isLoading={isLoading}
                  onCancel={() => {}}
                />

                {/* Tabs Ativas/Histórico */}
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'ativas' | 'historico')}>
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
                        isLoading={isLoading}
                        error={error?.message || null}
                        onStatusChange={handleStatusChange}
                        onRefresh={() => refetch()}
                      />
                    </Card>
                  </TabsContent>

                  <TabsContent value="historico">
                    <Card>
                      <DevolucaoTable 
                        devolucoes={devolucoesFiltradas.historico}
                        isLoading={isLoading}
                        error={error?.message || null}
                        onStatusChange={handleStatusChange}
                        onRefresh={() => refetch()}
                      />
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Pagination */}
                {totalPages > 1 && (
                  <DevolucaoPaginationControls 
                    currentPage={pagination.page || 1}
                    totalPages={totalPages}
                    onPageChange={(page) => setPagination({ ...pagination, page })}
                    isLoading={isLoading}
                  />
                )}
              </TabsContent>

              {/* Tab: Validação de Schema */}
              <TabsContent value="validation" className="mt-6">
                <SchemaValidationPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DevolucoesMercadoLivre() {
  return (
    <DevolucaoProvider>
      <DevolucoesMercadoLivreContent />
    </DevolucaoProvider>
  );
}
