/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - RECONSTRUÍDO DO ZERO
 * ✅ Cópia EXATA do padrão de /reclamacoes que FUNCIONA
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { DevolucaoProvider, useDevolucaoContext } from '@/features/devolucoes-online/contexts/DevolucaoProvider';
import { DevolucaoHeaderSection } from '@/features/devolucoes-online/components/DevolucaoHeaderSection';
import { DevolucaoStatsCards } from '@/features/devolucoes-online/components/DevolucaoStatsCards';
import { DevolucaoTable } from '@/features/devolucoes-online/components/DevolucaoTable';
import { DevolucaoAdvancedFiltersBar } from '@/features/devolucoes-online/components/DevolucaoAdvancedFiltersBar';
import { DevolucaoControlsBar } from '@/features/devolucoes-online/components/DevolucaoControlsBar';
import { UrgencyFilters } from '@/features/devolucoes-online/components/filters/UrgencyFilters';
import { CriticalDeadlinesNotification } from '@/features/devolucoes-online/components/notifications/CriticalDeadlinesNotification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StatusAnalise } from '@/features/devolucoes-online/types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '@/features/devolucoes-online/types/devolucao-analise.types';
import { useDevolucoesDirect } from '@/features/devolucoes-online/hooks/useDevolucoesDirect';

function DevolucoesMercadoLivreContent() {
  const { filters, setFilters, pagination, setPagination, viewMode, setViewMode } = useDevolucaoContext();
  
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodo, setPeriodo] = useState('60');
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<((dev: any) => boolean) | null>(null);
  const [currentUrgencyFilter, setCurrentUrgencyFilter] = useState<string>('all');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  // ✅ Hook simplificado - Busca direto da API
  const {
    devolucoes: apiDevolucoes,
    isLoading,
    error,
    fetchDevolucoes,
    cancelFetch
  } = useDevolucoesDirect(
    { periodo, date_from: filters.dateFrom, date_to: filters.dateTo },
    selectedAccountIds,
    shouldFetch
  );

  // Carregar contas ML
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      setAccounts(data || []);
      
      if (data && data.length > 0 && selectedAccountIds.length === 0) {
        const allIds = data.map(acc => acc.id);
        setSelectedAccountIds(allIds);
      }
    };
    
    fetchAccounts();
  }, []);

  // Estrutura de dados
  const devolucoesData = useMemo(() => ({
    data: apiDevolucoes || [],
    pagination: {
      total: apiDevolucoes?.length || 0,
      page: 1,
      limit: 50
    }
  }), [apiDevolucoes]);

  // Estatísticas
  const stats = useMemo(() => {
    const devs = apiDevolucoes || [];
    return {
      total: devs.length,
      pending: devs.filter((d: any) => d.status?.id === 'pending').length,
      approved: devs.filter((d: any) => d.status?.id === 'approved').length,
      refunded: devs.filter((d: any) => d.status_money?.id === 'refunded').length,
    };
  }, [apiDevolucoes]);

  // Filtro de urgência
  const devolucoesComUrgencyFilter = useMemo(() => {
    const devs = apiDevolucoes || [];
    if (urgencyFilter) {
      return devs.filter(urgencyFilter);
    }
    return devs;
  }, [apiDevolucoes, urgencyFilter]);

  // ✅ CRÍTICO: Expandir dados JSONB E adicionar empresa
  const devolucoesComEmpresa = useMemo(() => {
    return devolucoesComUrgencyFilter.map((dev: any) => {
      const account = accounts.find(acc => acc.id === dev.integration_account_id);
      
      // ✅ Expandir todos os campos JSONB prefixados dados_* para nível superior
      const expanded: any = { ...dev };
      
      // Processar cada campo que pode estar em formato JSONB prefixado
      Object.keys(dev).forEach(key => {
        if (key.startsWith('dados_') && dev[key] && typeof dev[key] === 'object') {
          // Expandir campos do objeto JSONB para o nível superior
          Object.keys(dev[key]).forEach(nestedKey => {
            // Se o campo ainda não existe no nível superior, adicionar
            if (!(nestedKey in expanded)) {
              expanded[nestedKey] = dev[key][nestedKey];
            }
          });
        }
      });
      
      return { 
        ...expanded, 
        empresa: account?.name || 'N/A' 
      };
    });
  }, [devolucoesComUrgencyFilter, accounts]);

  // Separar por tabs
  const devolucoesFiltradas = useMemo(() => {
    const ativas = devolucoesComEmpresa.filter((dev: any) =>
      ACTIVE_STATUSES.includes(dev.status_analise || 'pendente')
    );
    const historico = devolucoesComEmpresa.filter((dev: any) =>
      HISTORIC_STATUSES.includes(dev.status_analise || 'pendente')
    );
    return { ativas, historico };
  }, [devolucoesComEmpresa]);

  // ✅ Handler - Buscar da API
  const handleBuscar = async () => {
    if (selectedAccountIds.length === 0) {
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }

    const days = parseInt(periodo);
    toast.loading(`📡 Buscando devoluções dos últimos ${days} dias...`, { id: 'fetch-search' });
    
    await fetchDevolucoes();
  };

  const handleExport = () => {
    const jsonString = JSON.stringify(apiDevolucoes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devolucoes-ml-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${apiDevolucoes?.length || 0} devoluções exportadas`);
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
    toast.info('Atualização de status em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-background">
      <MLOrdersNav />
      
      <div className="container mx-auto p-6 space-y-6">
        <DevolucaoHeaderSection isRefreshing={isLoading} onRefresh={handleBuscar} />

        <Tabs value="dados" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="dados">Dados</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-6">
            <div className="space-y-6">
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

              <DevolucaoStatsCards stats={stats} />

              {(devolucoesData?.data?.length || 0) > 0 && (
                <UrgencyFilters 
                  devolucoes={devolucoesData?.data || []}
                  onFilterChange={setUrgencyFilter}
                  currentFilter={currentUrgencyFilter}
                  onCurrentFilterChange={setCurrentUrgencyFilter}
                />
              )}

              <div className="flex justify-end">
                <DevolucaoControlsBar 
                  autoRefreshEnabled={autoRefreshEnabled}
                  autoRefreshInterval={30000}
                  onAutoRefreshToggle={setAutoRefreshEnabled}
                  onAutoRefreshIntervalChange={() => {}}
                  onExport={handleExport}
                  onClear={handleClear}
                  onRefresh={handleBuscar} 
                  totalRecords={devolucoesData?.data?.length || 0}
                  isRefreshing={isLoading}
                />
              </div>

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
                onCancel={cancelFetch}
                apiData={apiDevolucoes || []}
              />

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
                      error={null}
                      onStatusChange={handleStatusChange}
                      onRefresh={handleBuscar}
                    />
                  </Card>
                </TabsContent>

                <TabsContent value="historico">
                  <Card>
                    <DevolucaoTable 
                      devolucoes={devolucoesFiltradas.historico}
                      isLoading={isLoading}
                      error={null}
                      onStatusChange={handleStatusChange}
                      onRefresh={handleBuscar}
                    />
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
        </Tabs>
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
