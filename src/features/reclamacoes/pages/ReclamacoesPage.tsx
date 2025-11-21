/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * Otimizada com cache localStorage + React Query
 */

import React, { useState, useMemo, useEffect } from 'react';
import { differenceInBusinessDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReclamacoesStorage } from '../hooks/useReclamacoesStorage';
import { useReclamacoesFiltersUnified } from '../hooks/useReclamacoesFiltersUnified';
import { useReclamacoesColumnManager } from '../hooks/useReclamacoesColumnManager';
import { ReclamacoesFilterBar } from '../components/ReclamacoesFilterBar';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { ReclamacoesLifecycleAlert } from '../components/ReclamacoesLifecycleAlert';
import { ReclamacoesLifecycleQuickFilter } from '../components/ReclamacoesLifecycleQuickFilter';
import { ReclamacoesAnotacoesModal } from '../components/modals/ReclamacoesAnotacoesModal';
import { ReclamacoesResumo } from '../components/ReclamacoesResumo';
import { Card } from '@/components/ui/card';
import { calcularStatusCiclo } from '../utils/reclamacaoLifecycle';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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


const validateMLAccounts = (mlAccounts: any[]) => ({ 
  valid: mlAccounts.length > 0, 
  accountIds: mlAccounts.map(acc => acc.id), 
  error: null 
});

export function ReclamacoesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed } = useSidebarUI();
  
  // 🔴 NOTIFICAÇÕES EM TEMPO REAL
  useReclamacoesRealtime(true);
  
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
  
  // 🎯 FASE 3: Hook avançado de gerenciamento de colunas
  const columnManager = useReclamacoesColumnManager();
  
  // Estados locais adicionais (não relacionados a filtros)
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [lifecycleFilter, setLifecycleFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);
  const [filtroResumo, setFiltroResumo] = useState<{tipo: 'prazo' | 'status' | 'tipo' | 'total'; valor: string} | null>(null);
  const [tableInstance, setTableInstance] = useState<any>(null);
  
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
  
  // Filtros adicionais não gerenciados pelo hook unificado
  const [additionalFilters, setAdditionalFilters] = useState({
    has_messages: '',
    has_evidences: '',
    date_from: '',
    date_to: ''
  });

  // Estado de busca manual
  const [isManualSearching, setIsManualSearching] = useState(false);
  
  // 🎯 FASE 2: Aliases para compatibilidade com código existente
  const selectedAccountIds = unifiedFilters.selectedAccounts;
  const currentPage = unifiedFilters.currentPage;
  const itemsPerPage = unifiedFilters.itemsPerPage;
  const setSelectedAccountIds = (ids: string[]) => updateFilter('selectedAccounts', ids);
  const setCurrentPage = (page: number) => updateFilter('currentPage', page);
  const setItemsPerPage = (limit: number) => updateFilter('itemsPerPage', limit);
  
  // Combinar filtros unificados + adicionais
  const filters = {
    periodo: unifiedFilters.periodo,
    status: unifiedFilters.status,
    type: unifiedFilters.type,
    stage: unifiedFilters.stage,
    ...additionalFilters
  };
  
  const setFilters = (newFilters: typeof filters | ((prev: typeof filters) => typeof filters)) => {
    const resolved = typeof newFilters === 'function' ? newFilters(filters) : newFilters;
    
    // Separar filtros unificados dos adicionais
    const { periodo, status, type, stage, has_messages, has_evidences, date_from, date_to } = resolved;
    
    updateFilters({ periodo, status, type, stage });
    setAdditionalFilters({ has_messages, has_evidences, date_from, date_to });
  };

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

  // 🎯 FASE 2: Auto-seleção de contas na primeira visita
  useEffect(() => {
    if (persistentCache.isStateLoaded && mlAccounts && mlAccounts.length > 0) {
      // ✅ CORREÇÃO: Verificar se persistedState e selectedAccounts existem antes de acessar length
      if (persistentCache.persistedState?.selectedAccounts && persistentCache.persistedState.selectedAccounts.length > 0) {
        return; // Não fazer nada, usar cache
      }
      
      // Se não há cache E não há seleção, auto-selecionar todas (primeira visita)
      if (selectedAccountIds.length === 0) {
        const { accountIds } = validateMLAccounts(mlAccounts);
        if (accountIds.length > 0) {
          updateFilter('selectedAccounts', accountIds);
          logger.debug('✨ Contas auto-selecionadas (primeira visita)', { 
            context: 'ReclamacoesPage',
            count: accountIds.length
          });
        }
      }
    }
  }, [persistentCache.isStateLoaded, mlAccounts, persistentCache.persistedState, selectedAccountIds.length]);

  // 🔍 BUSCAR RECLAMAÇÕES COM REACT QUERY + CACHE
  const { data: allReclamacoes = [], isLoading: loadingReclamacoes, error: errorReclamacoes, refetch: refetchReclamacoes } = useQuery({
    queryKey: ['reclamacoes', selectedAccountIds, filters],
    enabled: false, // 🔥 Desabilitar busca automática - só via handleBuscarReclamacoes
    queryFn: async () => {
      console.log('🔍 Buscando reclamações...', { selectedAccountIds, filters });
      
      if (!selectedAccountIds || selectedAccountIds.length === 0) {
        return [];
      }

      // Buscar seller_id das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier, name')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        throw new Error('Não foi possível obter informações das contas do Mercado Livre');
      }

      // Buscar claims de todas as contas
      const allClaims: any[] = [];
      
      for (const account of accountsData) {
        if (!account.account_identifier) {
          console.warn(`Conta ${account.id} sem seller_id`);
          continue;
        }

        console.log(`🔍 Buscando claims de ${account.name}...`);

        // Calcular data inicial baseada no período
        const calcularDataInicio = (periodo: string) => {
          const hoje = new Date();
          const dias = parseInt(periodo);
          hoje.setDate(hoje.getDate() - dias);
          return hoje.toISOString();
        };

        let dataInicio: string;
        let dataFim: string;

        if (filters.periodo === 'custom') {
          dataInicio = filters.date_from || calcularDataInicio('7');
          dataFim = filters.date_to || new Date().toISOString();
        } else {
          dataInicio = calcularDataInicio(filters.periodo);
          dataFim = new Date().toISOString();
        }

        // Buscar em lotes de 100
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const { data, error: fetchError } = await supabase.functions.invoke('ml-claims-fetch', {
            body: {
              accountId: account.id,
              sellerId: account.account_identifier,
              filters: {
                date_from: dataInicio,
                date_to: dataFim,
                status: filters.status,
                stage: filters.stage,
                type: filters.type,
              },
              limit,
              offset,
            },
          });

          if (fetchError) {
            console.error(`Erro ao buscar claims de ${account.name}:`, fetchError);
            break;
          }

          const claims = data?.claims || [];
          
          if (claims.length === 0) {
            hasMore = false;
          } else {
            // Adicionar account_name a cada claim
            const claimsWithAccount = claims.map((c: any) => ({
              ...c,
              account_name: account.name,
              account_id: account.id
            }));
            
            allClaims.push(...claimsWithAccount);
            offset += limit;
            
            if (claims.length < limit) {
              hasMore = false;
            }
          }
        }
      }

      console.log(`✅ Total de ${allClaims.length} reclamações carregadas`);
      
      // ✅ Salvar dados + filtros + colunas visíveis no cache
      persistentCache.saveDataCache(
        allClaims,
        selectedAccountIds,
        filters, // Já inclui período
        currentPage,
        itemsPerPage,
        Array.from(columnManager.state.visibleColumns) // 🔥 CORREÇÃO: Converter Set para Array
      );
      
      return allClaims;
    },
    
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados considerados "frescos"
    gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache do React Query
    
    // 🔥 CORREÇÃO CRÍTICA: Usar placeholderData ao invés de initialData
    // placeholderData é reavaliado SEMPRE que a query está desabilitada (enabled: false)
    // Isso permite restaurar dados do cache ao retornar à página
    placeholderData: () => {
      if (!persistentCache.hasValidPersistedState() || !persistentCache.persistedState?.reclamacoes) {
        return undefined;
      }

      const cached = persistentCache.persistedState;

      // ✅ VALIDAÇÃO CRÍTICA: Verificar se filtros atuais CORRESPONDEM aos filtros salvos com dados
      // Evita mostrar dados incorretos quando filtros foram alterados sem buscar
      
      // 1. Validar contas selecionadas
      const accountsMatch = 
        cached.selectedAccounts?.length === selectedAccountIds.length &&
        cached.selectedAccounts?.every(acc => selectedAccountIds.includes(acc));

      if (!accountsMatch) {
        console.log('⚠️ Cache ignorado: contas não correspondem', {
          cached: cached.selectedAccounts,
          current: selectedAccountIds
        });
        return undefined;
      }

      // 2. Validar filtros de busca
      const filtersMatch = 
        cached.filters?.periodo === filters.periodo &&
        cached.filters?.status === filters.status &&
        cached.filters?.type === filters.type &&
        cached.filters?.stage === filters.stage;

      if (!filtersMatch) {
        console.log('⚠️ Cache ignorado: filtros não correspondem', {
          cached: cached.filters,
          current: filters
        });
        return undefined;
      }

      // ✅ Filtros correspondem - seguro restaurar dados
      console.log('📦 Restaurando dados do cache (filtros validados):', cached.reclamacoes.length);
      return cached.reclamacoes;
    }
  });

  // 🔍 BUSCAR RECLAMAÇÕES - Função principal
  const handleBuscarReclamacoes = async () => {
    if (selectedAccountIds.length === 0) {
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
      
      // 🔥 CORREÇÃO: Salvar filtros APLICADOS para restauração futura
      console.log('💾 Salvando filtros aplicados no cache:', {
        periodo: unifiedFilters.periodo,
        status: unifiedFilters.status,
        type: unifiedFilters.type,
        stage: unifiedFilters.stage,
        selectedAccounts: selectedAccountIds
      });
      
      toast({
        title: "✅ Sucesso",
        description: `Busca concluída com sucesso`,
      });
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao buscar reclamações",
        variant: "destructive"
      });
    } finally {
      setIsManualSearching(false);
    }
  };

  // 🚫 CANCELAR BUSCA
  const handleCancelarBusca = () => {
    // Cancelar query do React Query
    queryClient.cancelQueries({ queryKey: ['reclamacoes', selectedAccountIds, filters] });
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
          
          // Calcular dias úteis
          const diasUteis = differenceInBusinessDays(hoje, dataCriacao);
          
          if (filtroResumo.valor === 'vencido') {
            // Vencidos = acima de 3 dias úteis
            return diasUteis > 3;
          } else if (filtroResumo.valor === 'a_vencer') {
            // A Vencer = de 0 a 3 dias úteis
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

  return (
    <ErrorBoundary>
      <div className="w-full">
        <div className="space-y-2 pb-20">
            {/* Sub-navegação */}
            <MLOrdersNav />
            
            {/* Header */}
            <div className="px-4 md:px-6 py-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">📋 Reclamações de Vendas</h1>
                </div>
                
                {/* Alertas de ciclo de vida - Posicionado no canto direito */}
                <div className="w-full max-w-sm shrink-0">
                  <ReclamacoesLifecycleAlert reclamacoes={reclamacoesEnriquecidas} />
                </div>
              </div>
            </div>

            {/* Filtros rápidos de ciclo de vida */}
            <div className="px-4 md:px-6">
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
            <div className="px-4 md:px-6 space-y-4">
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
                  
                  {/* Filtros integrados */}
                  <div className="flex-1 min-w-0">
                    <ReclamacoesFilterBar
                      accounts={mlAccounts || []}
                      selectedAccountIds={selectedAccountIds}
                      onAccountsChange={setSelectedAccountIds}
                      periodo={filters.periodo}
                      onPeriodoChange={(periodo) => setFilters({ ...filters, periodo })}
                      searchTerm={filters.status}
                      onSearchChange={(term) => setFilters({ ...filters, status: term })}
                      onBuscar={handleBuscarReclamacoes}
                      isLoading={isManualSearching}
                      onCancel={handleCancelarBusca}
                      table={tableInstance}
                    />
                  </div>
                </div>
                
                {/* Resumo de Métricas - após as abas */}
                <div className="mt-12">
                  <ReclamacoesResumo 
                    reclamacoes={reclamacoesEnriquecidas} 
                    onFiltroClick={setFiltroResumo}
                    filtroAtivo={filtroResumo}
                  />
                </div>

                <TabsContent value={activeTab}>
                  <Card className="p-6">
                    <ReclamacoesTable
                      reclamacoes={reclamacoesPaginadas}
                      isLoading={loadingReclamacoes || isManualSearching}
                      error={errorReclamacoes ? String(errorReclamacoes) : null}
                      onStatusChange={handleStatusChange}
                      onDeleteReclamacao={handleDeleteReclamacao}
                      onOpenAnotacoes={handleOpenAnotacoes}
                      anotacoes={anotacoes}
                      onTableReady={setTableInstance}
                      activeTab={activeTab}
                      columnManager={columnManager}
                    />
                  </Card>
                </TabsContent>
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
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                showFirstLastButtons={true}
                pageButtonLimit={5}
              />
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
}
