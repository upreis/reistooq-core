/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * Otimizada com cache localStorage + React Query
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReclamacoesStorage } from '../hooks/useReclamacoesStorage';
import { usePersistentReclamacoesState } from '../hooks/usePersistentReclamacoesState';
import { ReclamacoesFilterBar } from '../components/ReclamacoesFilterBar';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { ReclamacoesLifecycleAlert } from '../components/ReclamacoesLifecycleAlert';
import { ReclamacoesLifecycleQuickFilter } from '../components/ReclamacoesLifecycleQuickFilter';
import { ReclamacoesAnotacoesModal } from '../components/modals/ReclamacoesAnotacoesModal';
import { Card } from '@/components/ui/card';
import { calcularStatusCiclo } from '../utils/reclamacaoLifecycle';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { StatusAnalise } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '../types/devolucao-analise.types';
import { useToast } from '@/hooks/use-toast';

const validateMLAccounts = (mlAccounts: any[]) => ({ 
  valid: mlAccounts.length > 0, 
  accountIds: mlAccounts.map(acc => acc.id), 
  error: null 
});

export function ReclamacoesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 💾 CACHE PERSISTENTE (localStorage)
  const persistentCache = usePersistentReclamacoesState();
  
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [lifecycleFilter, setLifecycleFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [tableInstance, setTableInstance] = useState<any>(null);
  
  const [filters, setFilters] = useState({
    periodo: '60',
    status: '',
    type: '',
    stage: '',
    has_messages: '',
    has_evidences: '',
    date_from: '',
    date_to: ''
  });

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
  const [isManualSearching, setIsManualSearching] = useState(false);

  // 🔄 Restaurar estado do cache (APENAS UMA VEZ ao montar)
  useEffect(() => {
    if (persistentCache.isStateLoaded && persistentCache.persistedState) {
      const cached = persistentCache.persistedState;
      console.log('📦 Restaurando de localStorage');
      
      setSelectedAccountIds(cached.selectedAccounts || []);
      setFilters(prev => ({
        periodo: cached.filters?.periodo || prev.periodo,
        status: cached.filters?.status || prev.status,
        type: cached.filters?.type || prev.type,
        stage: cached.filters?.stage || prev.stage,
        has_messages: cached.filters?.has_messages || prev.has_messages,
        has_evidences: cached.filters?.has_evidences || prev.has_evidences,
        date_from: cached.filters?.date_from || prev.date_from,
        date_to: cached.filters?.date_to || prev.date_to,
      }));
      setCurrentPage(cached.currentPage || 1);
      setItemsPerPage(cached.itemsPerPage || 50);
    }
  }, [persistentCache.isStateLoaded]); // Apenas quando carrega

  // 💾 SALVAR NO LOCALSTORAGE quando filtros mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedAccountIds.length > 0) {
        persistentCache.saveState({
          selectedAccounts: selectedAccountIds,
          filters,
          currentPage,
          itemsPerPage
        });
      }
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timer);
  }, [selectedAccountIds, filters, currentPage, itemsPerPage]);

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

  // Auto-selecionar contas
  useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      const { accountIds } = validateMLAccounts(mlAccounts);
      if (accountIds.length > 0) {
        setSelectedAccountIds(accountIds);
        logger.debug('Contas auto-selecionadas', { 
          context: 'ReclamacoesPage',
          count: accountIds.length,
          accountIds 
        });
      }
    }
  }, [mlAccounts]);

  // 🔍 BUSCAR RECLAMAÇÕES COM REACT QUERY + CACHE
  const { data: allReclamacoes = [], isLoading: loadingReclamacoes, error: errorReclamacoes, refetch: refetchReclamacoes } = useQuery({
    queryKey: ['reclamacoes', selectedAccountIds, filters],
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


  // 💾 SALVAR NO LOCALSTORAGE quando filtros mudam (complemento ao URL)
  useEffect(() => {
    if (selectedAccountIds.length > 0) {
      persistentCache.saveDataCache(
        allReclamacoes,
        selectedAccountIds,
        filters,
        currentPage,
        itemsPerPage
      );
    }
  }, [selectedAccountIds, filters, currentPage, itemsPerPage, allReclamacoes]);

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
      return allClaims;
    },
    enabled: selectedAccountIds.length > 0 && !isManualSearching,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados considerados "frescos"
    gcTime: 30 * 60 * 1000, // 30 minutos - manter em cache do React Query
    // Inicializar com dados do localStorage se disponíveis
    initialData: () => {
      if (persistentCache.hasValidPersistedState()) {
        console.log('📦 Iniciando com dados do cache:', persistentCache.persistedState?.reclamacoes.length);
        return persistentCache.persistedState?.reclamacoes;
      }
      return undefined;
    },
    initialDataUpdatedAt: () => {
      return persistentCache.persistedState?.cachedAt || 0;
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

  // Aplicar filtros de lifecycle
  const reclamacoesFiltradas = useMemo(() => {
    if (!lifecycleFilter) return reclamacoesEnriquecidas;
    
    return reclamacoesEnriquecidas.filter((claim: any) => {
      return claim.lifecycle_status?.status === lifecycleFilter;
    });
  }, [reclamacoesEnriquecidas, lifecycleFilter]);

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
      <div className="container mx-auto py-6 space-y-6">
        <MLOrdersNav />

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">📋 Reclamações ML</h1>
        </div>

        {/* Alertas de ciclo de vida */}
        <ReclamacoesLifecycleAlert reclamacoes={reclamacoesEnriquecidas} />

        {/* Filtros rápidos de ciclo de vida */}
        <ReclamacoesLifecycleQuickFilter
          onFilterChange={setLifecycleFilter}
          counts={{
            critical: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'critical').length,
            urgent: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'urgent').length,
            attention: reclamacoesEnriquecidas.filter(c => c.lifecycle_status?.status === 'attention').length,
          }}
        />

        {/* Filtros principais */}
        <ReclamacoesFilterBar
          accounts={mlAccounts || []}
          selectedAccountIds={selectedAccountIds}
          onAccountsChange={setSelectedAccountIds}
          periodo={filters.periodo}
          onPeriodoChange={(periodo) => setFilters(prev => ({ ...prev, periodo }))}
          searchTerm=""
          onSearchChange={() => {}}
          onBuscar={handleBuscarReclamacoes}
          isLoading={isManualSearching || loadingReclamacoes}
          onCancel={handleCancelarBusca}
          table={tableInstance}
        />


        {/* Tabs: Ativas vs Histórico */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ativas">
              Ativas ({reclamacoesEnriquecidas.filter(c => ACTIVE_STATUSES.includes(c.status_analise_local as any)).length})
            </TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({reclamacoesEnriquecidas.filter(c => HISTORIC_STATUSES.includes(c.status_analise_local as any)).length})
            </TabsTrigger>
          </TabsList>

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
              />

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages} ({reclamacoesTab.length} reclamações)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

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
    </ErrorBoundary>
  );
}
