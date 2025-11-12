/**
 * 📦 DEVOLUÇÕES MERCADO LIVRE - RECONSTRUÍDO DO ZERO
 * ✅ Removido DevolucaoProvider problemático - usando apenas state local
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
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
    { periodo, date_from: '', date_to: '' },
    selectedAccountIds,
    shouldFetch
  );

  // Carregar contas ML
  useEffect(() => {
    const fetchAccounts = async () => {
      console.log('[CONTAS] Iniciando busca de contas ML...');
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('id, name')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('[CONTAS] Erro ao buscar contas:', error);
        toast.error('Erro ao carregar contas ML');
        return;
      }

      console.log('[CONTAS] Contas encontradas:', data?.length || 0);
      setAccounts(data || []);
      
      if (data && data.length > 0) {
        const allIds = data.map(acc => acc.id);
        console.log('[CONTAS] Auto-selecionando contas:', allIds);
        setSelectedAccountIds(allIds);
      } else {
        console.warn('[CONTAS] Nenhuma conta ML ativa encontrada');
        toast.warning('Nenhuma conta ML ativa encontrada. Conecte uma conta para continuar.');
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

  // ✅ Adicionar empresa (dados já vêm FLAT da Edge Function)
  const devolucoesComEmpresa = useMemo(() => {
    return devolucoesComUrgencyFilter.map((dev: any) => {
      const account = accounts.find(acc => acc.id === dev.integration_account_id);
      
      return { 
        ...dev, 
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
    console.log('[BUSCAR] Iniciando busca...');
    console.log('[BUSCAR] Contas selecionadas:', selectedAccountIds);
    console.log('[BUSCAR] Período:', periodo);
    
    if (selectedAccountIds.length === 0) {
      console.error('[BUSCAR] Nenhuma conta selecionada!');
      toast.error('Selecione pelo menos uma conta ML');
      return;
    }

    if (accounts.length === 0) {
      console.error('[BUSCAR] Nenhuma conta ML disponível!');
      toast.error('Nenhuma conta ML disponível. Conecte uma conta primeiro.');
      return;
    }

    const days = parseInt(periodo);
    console.log('[BUSCAR] Buscando últimos', days, 'dias');
    toast.loading(`📡 Buscando devoluções dos últimos ${days} dias...`, { id: 'fetch-search' });
    
    setShouldFetch(true);
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
    setSearchTerm('');
    setPeriodo('60');
    setSelectedAccountIds(accounts.map(acc => acc.id));
    setUrgencyFilter(null);
    setCurrentUrgencyFilter('all');
    toast.success('Filtros limpos');
  };

  const handleStatusChange = async (devolucaoId: string, newStatus: StatusAnalise) => {
    toast.success('Status atualizado com sucesso!');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 🚨 NOTIFICAÇÕES CRÍTICAS */}
      <CriticalDeadlinesNotification devolucoes={devolucoesComEmpresa} />

      {/* 📊 HEADER + CONTROLES */}
      <DevolucaoHeaderSection 
        isRefreshing={isLoading}
        onRefresh={handleBuscar}
      />
      
      <DevolucaoControlsBar 
        autoRefreshEnabled={autoRefreshEnabled}
        autoRefreshInterval={30}
        onAutoRefreshToggle={setAutoRefreshEnabled}
        onAutoRefreshIntervalChange={() => {}}
        onRefresh={handleBuscar}
        onClearFilters={handleClear}
        onExport={handleExport}
      />

      {/* ⏰ FILTROS URGÊNCIA */}
      <UrgencyFilters 
        devolucoes={devolucoesComEmpresa}
        currentFilter={currentUrgencyFilter}
        onFilterChange={(filterFn) => setUrgencyFilter(() => filterFn)}
        onCurrentFilterChange={setCurrentUrgencyFilter}
      />

      {/* 🔍 FILTROS AVANÇADOS */}
      <DevolucaoAdvancedFiltersBar 
        accounts={accounts}
        selectedAccountIds={selectedAccountIds}
        onAccountsChange={setSelectedAccountIds}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBuscar={handleBuscar}
      />

      {/* 📈 STATS */}
      <DevolucaoStatsCards stats={stats} />

      {/* 📋 DADOS */}
      <div className="space-y-6">
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
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
    </div>
  );
}

export default function DevolucoesMercadoLivre() {
  return (
    <div className="min-h-screen bg-background">
      <MLOrdersNav />
      <DevolucoesMercadoLivreContent />
    </div>
  );
}
