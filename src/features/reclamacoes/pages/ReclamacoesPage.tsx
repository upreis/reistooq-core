/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * Otimizada com cache localStorage + React Query
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { differenceInBusinessDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReclamacoesStorage } from '../hooks/useReclamacoesStorage';
import { useReclamacoesFiltersUnified } from '../hooks/useReclamacoesFiltersUnified';
import { useReclamacoesColumnManager } from '../hooks/useReclamacoesColumnManager';
import { useMLClaimsFromCache } from '../hooks/useMLClaimsFromCache';
import type { VisibilityState } from '@tanstack/react-table';

import { ReclamacoesFilterBar } from '../components/ReclamacoesFilterBar';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { ReclamacoesLifecycleAlert } from '../components/ReclamacoesLifecycleAlert';
import { ReclamacoesLifecycleQuickFilter } from '../components/ReclamacoesLifecycleQuickFilter';
import { ReclamacoesAnotacoesModal } from '../components/modals/ReclamacoesAnotacoesModal';
import { ReclamacoesResumo } from '../components/ReclamacoesResumo';
import { ReclamacoesColumnSelectorSimple } from '../components/ReclamacoesColumnSelectorSimple';
import { RECLAMACOES_COLUMN_DEFINITIONS } from '../config/reclamacoes-column-definitions';
import { Card } from '@/components/ui/card';
import { calcularStatusCiclo } from '../utils/reclamacaoLifecycle';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/utils/logger';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '../types/devolucao-analise.types';
import { useToast } from '@/hooks/use-toast';
import { useReclamacoesRealtime } from '../hooks/useReclamacoesRealtime';
import { useSidebarUI } from '@/context/SidebarUIContext';
import { ReclamacoesPagination } from '../components/ReclamacoesPagination';
import { LoadingIndicator } from '@/components/pedidos/LoadingIndicator';



export function ReclamacoesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed } = useSidebarUI();
  
  // 🔴 NOTIFICAÇÕES EM TEMPO REAL
  useReclamacoesRealtime(true);
  
  // 🎯 COLUMN MANAGER
  const columnManager = useReclamacoesColumnManager();
  const [tableInstance, setTableInstance] = useState<any>(null);
  
  // 🎯 FASE 2: Hook unificado de filtros (com URL sync + localStorage)
  const {
    filters: unifiedFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    resetSearchFilters,
    hasActiveFilters,
    activeFilterCount,
    persistentCache
  } = useReclamacoesFiltersUnified();
  
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  
  // Estados locais adicionais (não relacionados a filtros)
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [lifecycleFilter, setLifecycleFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);
  const [filtroResumo, setFiltroResumo] = useState<{tipo: 'prazo' | 'status' | 'tipo' | 'total'; valor: string} | null>(null);
  
  // 💾 STORAGE DE ANOTAÇÕES (mantido separado)
  const {
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    removeReclamacao
  } = useReclamacoesStorage();
  
  // Modal de anotações
  const [anotacoesModalOpen, setAnotacoesModalOpen] = useState(false);
  const [selectedClaimForAnotacoes, setSelectedClaimForAnotacoes] = useState<any | null>(null);

  // Estado de busca manual
  const [isManualSearching, setIsManualSearching] = useState(false);
  
  // Constantes derivadas dos filtros unificados
  const selectedAccountIds = unifiedFilters.selectedAccounts;
  const currentPage = unifiedFilters.currentPage || 1;
  const itemsPerPage = unifiedFilters.itemsPerPage || 50;

  // Buscar contas ML disponíveis
  const { data: mlAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["ml-accounts-reclamacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_accounts")
        .select("id, name, account_identifier, organization_id, is_active, provider")
        .eq("provider", "mercadolivre")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Auto-seleção de contas na primeira visita
  useEffect(() => {
    if (persistentCache.isStateLoaded && mlAccounts && mlAccounts.length > 0) {
      if (persistentCache.persistedState?.selectedAccounts?.length > 0) {
        return;
      }
      
      if (!selectedAccountIds || selectedAccountIds.length === 0) {
        const accountIds = mlAccounts.map(acc => acc.id);
        if (accountIds.length > 0) {
          updateFilter('selectedAccounts', accountIds);
        }
      }
    }
  }, [persistentCache.isStateLoaded, mlAccounts, persistentCache.persistedState?.selectedAccounts, selectedAccountIds]);

  // ✅ COMBO 2: Calcular período ISO para busca
  const calcularDataInicio = (periodo: string) => {
    const hoje = new Date();
    const dias = parseInt(periodo);
    hoje.setDate(hoje.getDate() - dias);
    return hoje.toISOString();
  };

  const dateFromISO = calcularDataInicio(unifiedFilters.periodo);
  const dateToISO = new Date().toISOString();

  // ✅ COMBO 2: Buscar reclamações usando cache-first + fallback API
  // 🔧 FIX: Estabilizar accountsForQuery com useMemo para evitar loop infinito
  const accountsForQuery = useMemo(() => {
    if (selectedAccountIds && selectedAccountIds.length > 0) {
      return selectedAccountIds;
    }
    return mlAccounts?.map(acc => acc.id) || [];
  }, [selectedAccountIds, mlAccounts]);
    
  const { 
    data: cacheResponse, 
    isLoading: loadingReclamacoes, 
    isFetching,
    error: errorReclamacoes, 
    refetch: refetchReclamacoes 
  } = useMLClaimsFromCache({
    integration_account_ids: accountsForQuery,
    date_from: dateFromISO,
    date_to: dateToISO,
    enabled: accountsForQuery.length > 0 // ✅ só executar se tiver contas
  });

  // ✅ COMBO 2: Extrair reclamações da resposta do cache
  const allReclamacoes = useMemo(() => {
    if (cacheResponse?.success && cacheResponse.reclamacoes) {
      console.log('📋 [ReclamacoesPage] Dados recebidos:', {
        total: cacheResponse.reclamacoes.length,
        source: cacheResponse.source
      });
      return cacheResponse.reclamacoes;
    }
    return [];
  }, [cacheResponse]); // ✅ Removido loadingReclamacoes para evitar loop

  // ✅ COMBO 2: Buscar reclamações - Manual refetch
  const handleBuscarReclamacoes = async () => {
    if (!selectedAccountIds?.length) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos uma conta ML",
        variant: "destructive"
      });
      return;
    }

    setIsManualSearching(true);

    try {
      await refetchReclamacoes();
      
      const source = cacheResponse?.source === 'cache' ? 'cache' : 'API';
      
      toast({
        title: "✅ Sucesso",
        description: `Busca concluída com sucesso (fonte: ${source})`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao buscar reclamações",
        variant: "destructive"
      });
    } finally {
      setIsManualSearching(false);
    }
  };

  // ✅ COMBO 2: Cancelar busca
  const handleCancelarBusca = () => {
    queryClient.cancelQueries({ queryKey: ['reclamacoes-ml-claims-cache', selectedAccountIds.slice().sort().join(','), dateFromISO, dateToISO] });
    setIsManualSearching(false);
    
    toast({
      title: "Busca cancelada",
      description: "A busca foi cancelada pelo usuário",
    });
  };

  // Enriquecer dados com status de análise
  const reclamacoesEnriquecidas = useMemo(() => {
    return allReclamacoes.map((claim: any) => ({
      ...claim,
      status_analise_local: analiseStatus[claim.claim_id] || 'pendente',
      anotacao_local: anotacoes[claim.claim_id] || '',
      lifecycle_status: calcularStatusCiclo(claim)
    }));
  }, [allReclamacoes, analiseStatus, anotacoes]);

  // Aplicar filtros de lifecycle e resumo
  const reclamacoesFiltradas = useMemo(() => {
    let result = reclamacoesEnriquecidas;
    
    // Filtro lifecycle
    if (lifecycleFilter) {
      result = result.filter((claim: any) => 
        claim.lifecycle_status?.status === lifecycleFilter
      );
    }
    
    // Filtro resumo
    if (filtroResumo) {
      result = result.filter((claim: any) => {
        if (filtroResumo.tipo === 'prazo') {
          if (!claim.date_created) return false;
          
          const hoje = new Date();
          const dataCriacao = new Date(claim.date_created);
          
          const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
          
          if (filtroResumo.valor === 'vencido') {
            return diasUteis > 3;
          } else if (filtroResumo.valor === 'a_vencer') {
            return diasUteis >= 0 && diasUteis <= 3;
          }
        } else if (filtroResumo.tipo === 'status') {
          return claim.status_analise_local === filtroResumo.valor;
        } else if (filtroResumo.tipo === 'tipo') {
          return claim.type === filtroResumo.valor;
        }
        return true;
      });
    }
    
    return result;
  }, [reclamacoesEnriquecidas, lifecycleFilter, filtroResumo]);

  // Filtrar por tab (ativas vs histórico)
  const reclamacoesTab = useMemo(() => {
    return reclamacoesFiltradas.filter((claim: any) => {
      const status = claim.status_analise_local;
      if (activeTab === 'ativas') {
        return ACTIVE_STATUSES.includes(status as any);
      } else {
        return HISTORIC_STATUSES.includes(status as any);
      }
    });
  }, [reclamacoesFiltradas, activeTab]);

  // Paginação
  const totalPages = Math.ceil(reclamacoesTab.length / itemsPerPage);
  
  const reclamacoesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return reclamacoesTab.slice(start, end);
  }, [reclamacoesTab, currentPage, itemsPerPage]);
  
  const tabCounts = useMemo(() => ({
    ativas: reclamacoesEnriquecidas.filter(c => ACTIVE_STATUSES.includes(c.status_analise_local as any)).length,
    historico: reclamacoesEnriquecidas.filter(c => HISTORIC_STATUSES.includes(c.status_analise_local as any)).length
  }), [reclamacoesEnriquecidas]);

  // Handlers
  const handleStatusChange = (claimId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(prevStatus => ({
      ...prevStatus,
      [claimId]: newStatus
    }));
    
    toast({
      title: "Status atualizado",
      description: `Reclamação marcada como: ${newStatus}`,
    });
  };

  const handleDeleteReclamacao = (claimId: string) => {
    removeReclamacao(claimId);
    toast({
      title: "Reclamação removida",
      description: "A reclamação foi removida do cache local.",
    });
  };

  const handleOpenAnotacoes = (claim: any) => {
    setSelectedClaimForAnotacoes(claim);
    setAnotacoesModalOpen(true);
  };

  const handleSaveAnotacao = (claimId: string, anotacao: string) => {
    saveAnotacao(claimId, anotacao);
    toast({
      title: "Anotação salva",
      description: "Anotação salva com sucesso no armazenamento local.",
    });
  };

  // 🔗 FILTRAR COLUNAS VISÍVEIS - CONVERTIDO EM ARRAY PARA FORÇAR RE-RENDER
  // ✅ DEPENDÊNCIAS: size + join forçam recálculo quando Set muda
  const visibleColumnKeys = useMemo(() => {
    const keysArray = Array.from(columnManager.state.visibleColumns);
    console.log('🔄 [ReclamacoesPage] visibleColumnKeys recalculado:', {
      count: keysArray.length,
      keys: keysArray
    });
    return keysArray;
  }, [columnManager.state.visibleColumns.size, Array.from(columnManager.state.visibleColumns).join(',')]);

  console.log('🎯 [ReclamacoesPage] Colunas visíveis:', {
    count: visibleColumnKeys.length,
    keys: visibleColumnKeys
  });

  const handleTableReady = useCallback((table: any) => {
    setTableInstance(table);
  }, []);


  // Loading state
  if (loadingAccounts) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando contas...</p>
      </div>
    );
  }

  // Empty state
  if (!mlAccounts || mlAccounts.length === 0) {
    return <ReclamacoesEmptyState type="no-integration" />;
  }

  // ✅ FIX: Mostrar dados mesmo durante isFetching (polling)
  // Apenas bloquear UI se for primeira busca (loadingReclamacoes && allReclamacoes.length === 0)
  const isInitialLoading = loadingReclamacoes && allReclamacoes.length === 0;

  if (isInitialLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando reclamações...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full">
        <div className="pb-20">
            {/* Sub-navegação */}
            <div className="px-4 md:px-6">
              <MLOrdersNav />
            </div>
            
            {/* Header */}
            <div className="px-4 md:px-6 py-3 mt-2">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 flex items-center gap-3">
                  <h1 className="text-3xl font-bold">📋 Reclamações de Vendas</h1>
                  
                  {/* ✅ COMBO 2 FASE 3: Badge de polling automático (60s) */}
                  {isFetching && !loadingReclamacoes && (
                    <Badge 
                      variant="outline" 
                      className="gap-2 animate-pulse border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                    >
                      <Radio className="h-3 w-3" />
                      <span className="text-xs font-medium">Atualizando dados...</span>
                    </Badge>
                  )}
                </div>
                
                {/* Alertas de ciclo de vida - Posicionado no canto direito */}
                <div className="w-full max-w-sm shrink-0">
                  <ReclamacoesLifecycleAlert reclamacoes={reclamacoesEnriquecidas} />
                </div>
              </div>
            </div>

            {/* Filtros rápidos de ciclo de vida */}
            <div className="px-4 md:px-6 mt-2">
              <ReclamacoesLifecycleQuickFilter
                onFilterChange={setLifecycleFilter}
                counts={{
                  critical: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'critical').length,
                  urgent: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'urgent').length,
                  attention: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'attention').length,
                }}
              />
            </div>


            {/* Tabs: Ativas vs Histórico + Filtros */}
            <div className="px-4 md:px-6 mt-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
                <div className="flex items-center gap-3 flex-nowrap">
                  <TabsList className="grid w-auto grid-cols-2 shrink-0 h-10">
                    <TabsTrigger value="ativas" className="h-10">
                      Ativas ({reclamacoesEnriquecidas.filter(c => ACTIVE_STATUSES.includes(c.status_analise_local as any)).length})
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="h-10">
                      Histórico ({reclamacoesEnriquecidas.filter(c => HISTORIC_STATUSES.includes(c.status_analise_local as any)).length})
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Filtros integrados + Seletor de Colunas */}
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="flex-1">
                      <ReclamacoesFilterBar
                        accounts={mlAccounts || []}
                        selectedAccountIds={selectedAccountIds}
                        onAccountsChange={(ids) => updateFilter('selectedAccounts', ids)}
                        periodo={unifiedFilters.periodo}
                        onPeriodoChange={(periodo) => updateFilter('periodo', periodo)}
                        searchTerm={unifiedFilters.status}
                        onSearchChange={(term) => updateFilter('status', term)}
                        onBuscar={handleBuscarReclamacoes}
                        isLoading={isManualSearching}
                        onCancel={handleCancelarBusca}
                      />
                    </div>
                    
                    {/* Seletor de Colunas SIMPLES */}
                    <ReclamacoesColumnSelectorSimple
                      columns={RECLAMACOES_COLUMN_DEFINITIONS}
                      visibleColumns={columnManager.visibleColumnKeys}
                      onVisibleColumnsChange={(keys) => {
                        console.log('🎛️ [Page] onVisibleColumnsChange chamado:', keys);
                        columnManager.actions.setVisibleColumns(keys);
                      }}
                    />
                  </div>
                </div>
                
                {/* Resumo de Métricas - após as abas */}
                <div className="px-4 md:px-6 mt-12">
                  <ReclamacoesResumo 
                    reclamacoes={reclamacoesEnriquecidas} 
                    onFiltroClick={setFiltroResumo}
                    filtroAtivo={filtroResumo}
                  />
                </div>

                {/* Área da tabela com loader localizado */}
                <div className="relative">
                  {/* 🔄 LOADER APENAS NA ÁREA DA TABELA */}
                  {(loadingReclamacoes || isManualSearching) && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                      <LoadingIndicator />
                    </div>
                  )}
                  
                  <TabsContent value={activeTab} className="mt-2">
                    <ReclamacoesTable
                      reclamacoes={reclamacoesPaginadas}
                      isLoading={loadingReclamacoes || isManualSearching}
                      error={errorReclamacoes ? String(errorReclamacoes) : null}
                      onStatusChange={handleStatusChange}
                      onDeleteReclamacao={handleDeleteReclamacao}
                      onOpenAnotacoes={handleOpenAnotacoes}
                      anotacoes={anotacoes}
                      activeTab={activeTab}
                      visibleColumnKeys={columnManager.visibleColumnKeys}
                      onTableReady={handleTableReady}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Modal de anotações */}
            {selectedClaimForAnotacoes && (
              <ReclamacoesAnotacoesModal
                open={anotacoesModalOpen}
                onOpenChange={setAnotacoesModalOpen}
                claimId={selectedClaimForAnotacoes.claim_id}
                orderId={selectedClaimForAnotacoes.order_id}
                anotacaoAtual={anotacoes[selectedClaimForAnotacoes.claim_id] || ''}
                onSave={(claimId, anotacao) => handleSaveAnotacao(claimId, anotacao)}
              />
            )}
          </div>

          {/* Rodapé Fixado com Paginação */}
          {reclamacoesTab.length > 0 && (
            <div 
              className={`fixed bottom-0 right-0 bg-background border-t shadow-lg z-40 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:left-[72px]' : 'md:left-72'
              } left-0`}
            >
              <ReclamacoesPagination
                totalItems={reclamacoesTab.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={(page) => updateFilter('currentPage', page)}
                onItemsPerPageChange={(limit) => updateFilter('itemsPerPage', limit)}
                showFirstLastButtons={true}
                pageButtonLimit={5}
              />
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
}
