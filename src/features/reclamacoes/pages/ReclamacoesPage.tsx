/**
 * 📋 PÁGINA PRINCIPAL DE RECLAMAÇÕES
 * FASE 1: Estrutura básica com filtros e tabela
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReclamacoes } from '../hooks/useReclamacoes';
import { useReclamacoesIncremental } from '../hooks/useReclamacoesIncremental';
import { useReclamacoesStorage } from '../hooks/useReclamacoesStorage';
import { ReclamacoesFilterBar } from '../components/ReclamacoesFilterBar';
import { ReclamacoesFilters } from '../components/ReclamacoesFilters';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesExport } from '../components/ReclamacoesExport';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, X, Search } from 'lucide-react';
import { validateMLAccounts } from '@/features/devolucoes/utils/AccountValidator';
import { logger } from '@/utils/logger';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
import { OMSNav } from '@/features/oms/components/OMSNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { StatusAnalise, STATUS_ATIVOS, STATUS_HISTORICO } from '../types/devolucao-analise.types';
import { STATUS_ATIVOS as ACTIVE_STATUSES, STATUS_HISTORICO as HISTORIC_STATUSES } from '../types/devolucao-analise.types';
import { useToast } from '@/hooks/use-toast';


export function ReclamacoesPage() {
  const { toast } = useToast();
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  
  // 📄 PAGINAÇÃO LOCAL PARA DADOS IN-MEMORY
  const [localPagination, setLocalPagination] = useState({
    currentPage: 1,
    itemsPerPage: 50
  });
  
  // 💾 PERSISTÊNCIA COM LOCALSTORAGE
  const {
    dadosInMemory,
    setDadosInMemory,
    analiseStatus,
    setAnaliseStatus,
    clearOldData,
    clearStorage
  } = useReclamacoesStorage();

  // Limpar dados antigos ao montar componente e verificar se já tem dados no storage
  React.useEffect(() => {
    clearOldData();
    // Marcar que já carregou do storage se houver dados
    if (Object.keys(dadosInMemory).length > 0) {
      setHasLoadedFromStorage(true);
      console.log('📦 Dados carregados do localStorage:', Object.keys(dadosInMemory).length, 'registros');
    }
  }, [clearOldData]);
  
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

  // Auto-selecionar contas usando validação centralizada
  React.useEffect(() => {
    if (mlAccounts && mlAccounts.length > 0 && selectedAccountIds.length === 0) {
      const { accountIds } = validateMLAccounts(mlAccounts, selectedAccountIds);
      if (accountIds.length > 0) {
        setSelectedAccountIds(accountIds);
        logger.debug('Contas auto-selecionadas', { 
          context: 'ReclamacoesPage',
          count: accountIds.length,
          accountIds 
        });
      }
    }
  }, [mlAccounts, selectedAccountIds.length]);

  const {
    reclamacoes: rawReclamacoes,
    allClaims: allRawClaims, // ✅ TODOS OS DADOS (não apenas a página atual)
    isLoading,
    isRefreshing,
    error,
    pagination,
    goToPage,
    changeItemsPerPage,
    refresh,
    cancelFetch
  } = useReclamacoes(filters, selectedAccountIds, shouldFetch);

  // 🚀 Hook incremental para buscar apenas mudanças
  const { 
    fetchIncremental, 
    resetIncremental, 
    isLoadingIncremental 
  } = useReclamacoesIncremental();

  // 🔄 Auto-refresh INCREMENTAL a cada 30 segundos
  React.useEffect(() => {
    if (!autoRefreshEnabled || !shouldFetch) return;
    
    const interval = setInterval(async () => {
      console.log('🔄 Auto-refresh incremental - buscando atualizações...');
      
      // ✅ SEMPRE usar 60 dias no auto-refresh
      const dataInicio60Dias = new Date();
      dataInicio60Dias.setDate(dataInicio60Dias.getDate() - 60);
      
      const { newClaims, updatedClaims } = await fetchIncremental({
        selectedAccountIds, // Todas as contas selecionadas
        filters: {
          status: filters.status,
          type: filters.type,
          date_from: dataInicio60Dias.toISOString(), // Sempre 60 dias
          date_to: new Date().toISOString() // Agora
        }
      });

      // ✅ PROCESSAR apenas se houver mudanças
      if (newClaims.length > 0 || updatedClaims.length > 0) {
        const allChanges = [...newClaims, ...updatedClaims];
        
        setDadosInMemory(prevData => {
          const newData = { ...prevData };
          const agora = new Date().toISOString();

          allChanges.forEach((claim: any) => {
            const claimId = claim.claim_id;
            const existing = newData[claimId];

            if (!existing) {
              // Novo registro
              newData[claimId] = {
                ...claim,
                primeira_vez_visto: agora,
                campos_atualizados: [],
                snapshot_anterior: null
              };
            } else {
              // Registro existente - detectar mudanças
              const camposAtualizados = [];
              const camposParaMonitorar = [
                'status', 'stage', 'last_updated', 'resolution', 
                'benefited', 'resolution_reason', 'messages_count'
              ];

              for (const campo of camposParaMonitorar) {
                if (claim[campo] !== existing[campo]) {
                  camposAtualizados.push({
                    campo,
                    valor_anterior: existing[campo],
                    valor_novo: claim[campo],
                    data_mudanca: agora
                  });
                }
              }

              newData[claimId] = {
                ...claim,
                primeira_vez_visto: existing.primeira_vez_visto,
                campos_atualizados: camposAtualizados.length > 0 
                  ? camposAtualizados 
                  : (existing.campos_atualizados || []),
                snapshot_anterior: camposAtualizados.length > 0 ? existing : existing.snapshot_anterior,
                ultima_atualizacao_real: camposAtualizados.length > 0 ? agora : existing.ultima_atualizacao_real
              };
            }
          });

          return newData;
        });
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      console.log('🛑 Auto-refresh desativado');
    };
  }, [autoRefreshEnabled, shouldFetch, selectedAccountIds, filters.status, filters.type, fetchIncremental, setDadosInMemory]);

  // 🔥 MERGE de dados da API com in-memory (mantém histórico + detecta mudanças)
  // ✅ USAR TODOS OS DADOS (allRawClaims) não apenas a página atual
  React.useEffect(() => {
    if (allRawClaims.length > 0) {
      console.log(`💾 Salvando ${allRawClaims.length} reclamações no localStorage...`);
      
      setDadosInMemory(prevData => {
        const newData = { ...prevData };
        const agora = new Date().toISOString();

        allRawClaims.forEach((claim: any) => {
          const claimId = claim.claim_id;
          const existing = newData[claimId];

          if (!existing) {
            // Novo registro
            newData[claimId] = {
              ...claim,
              primeira_vez_visto: agora,
              campos_atualizados: [],
              snapshot_anterior: null
            };
          } else {
            // Registro existente - detectar mudanças
            const camposAtualizados = [];
            const camposParaMonitorar = [
              'status', 'stage', 'last_updated', 'resolution', 
              'benefited', 'resolution_reason', 'messages_count'
            ];

            for (const campo of camposParaMonitorar) {
              if (claim[campo] !== existing[campo]) {
                camposAtualizados.push({
                  campo,
                  valor_anterior: existing[campo],
                  valor_novo: claim[campo],
                  data_mudanca: agora
                });
              }
            }

            newData[claimId] = {
              ...claim,
              primeira_vez_visto: existing.primeira_vez_visto,
              campos_atualizados: camposAtualizados.length > 0 
                ? camposAtualizados 
                : (existing.campos_atualizados || []),
              snapshot_anterior: camposAtualizados.length > 0 ? existing : existing.snapshot_anterior,
              ultima_atualizacao_real: camposAtualizados.length > 0 ? agora : existing.ultima_atualizacao_real
            };
          }
        });

        console.log(`✅ Total salvo no localStorage: ${Object.keys(newData).length} registros`);
        return newData;
      });
    }
  }, [allRawClaims]); // ✅ REMOVIDO setDadosInMemory das dependências

  // Converter dados in-memory para array e aplicar análise
  const reclamacoesWithAnalise = useMemo(() => {
    const dataArray = Object.values(dadosInMemory);
    
    return dataArray
      .map((claim: any) => ({
        ...claim,
        status_analise: analiseStatus[claim.claim_id] || 'pendente'
      }))
      // 🔥 ORDENAÇÃO AUTOMÁTICA por Última Atualização (mais recentes primeiro)
      .sort((a, b) => {
        const dateA = new Date(a.last_updated || a.date_created);
        const dateB = new Date(b.last_updated || b.date_created);
        return dateB.getTime() - dateA.getTime();
      });
  }, [dadosInMemory, analiseStatus]);

  // Handler de mudança de status
  const handleStatusChange = (claimId: string, newStatus: StatusAnalise) => {
    setAnaliseStatus(prev => ({
      ...prev,
      [claimId]: newStatus
    }));
    
    toast({
      title: 'Status atualizado',
      description: `Reclamação ${claimId} marcada como ${newStatus}`
    });
  };

  // Filtrar por aba ativa
  const reclamacoesAtivas = useMemo(() => {
    return reclamacoesWithAnalise.filter((claim: any) => 
      ACTIVE_STATUSES.includes(claim.status_analise)
    );
  }, [reclamacoesWithAnalise]);

  const reclamacoesHistorico = useMemo(() => {
    return reclamacoesWithAnalise.filter((claim: any) => 
      HISTORIC_STATUSES.includes(claim.status_analise)
    );
  }, [reclamacoesWithAnalise]);

  const reclamacoes = activeTab === 'ativas' ? reclamacoesAtivas : reclamacoesHistorico;

  // 📊 PAGINAÇÃO CALCULADA BASEADA NOS DADOS ATUAIS
  const paginacaoCalculada = useMemo(() => {
    const total = reclamacoes.length;
    const totalPages = Math.ceil(total / localPagination.itemsPerPage) || 1;
    const currentPage = Math.min(localPagination.currentPage, totalPages);
    
    return {
      currentPage,
      itemsPerPage: localPagination.itemsPerPage,
      totalItems: total,
      totalPages
    };
  }, [reclamacoes.length, localPagination.currentPage, localPagination.itemsPerPage]);

  const handleBuscar = () => {
    if (selectedAccountIds.length === 0) {
      return;
    }
    setHasLoadedFromStorage(true); // Marcar que iniciou uma busca
    setLocalPagination({ currentPage: 1, itemsPerPage: 50 }); // Reset paginação
    // Reset incremental ao fazer busca manual completa
    resetIncremental();
    // Alternar o valor para forçar nova busca mesmo se já estava true
    setShouldFetch(prev => !prev);
  };

  const handleLimparDados = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados salvos?')) {
      clearStorage();
      toast({
        title: 'Dados limpos',
        description: 'Todos os dados foram removidos. Faça uma nova busca.'
      });
    }
  };

  const hasActiveAdvancedFilters = filters.status !== '' || 
                                   filters.type !== '' ||
                                   filters.stage !== '' ||
                                   filters.has_messages !== '' ||
                                   filters.has_evidences !== '';

  const clearAdvancedFilters = () => {
    setFilters({
      ...filters,
      status: '',
      type: '',
      stage: '',
      has_messages: '',
      has_evidences: ''
    });
  };

  // Verificar se há erro de integração
  const hasIntegrationError = error?.includes('seller_id') || error?.includes('integração');

  // Loading states
  if (loadingAccounts) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Carregando contas...</p>
        </div>
      </div>
    );
  }

  // Sem contas ML
  if (!mlAccounts || mlAccounts.length === 0) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          {/* Breadcrumb principal */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>📦</span>
            <span>/</span>
            <span className="text-primary">Vendas</span>
          </div>

          {/* Navigation tabs principais */}
          <OMSNav />

          {/* Sub-navegação de Pedidos */}
          <MLOrdersNav />

          <div>
            <h1 className="text-3xl font-bold">Reclamações</h1>
            <p className="text-muted-foreground">
              Gerencie claims e mediações do Mercado Livre
            </p>
          </div>
          <ReclamacoesEmptyState type="no-integration" />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Breadcrumb principal */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>📦</span>
          <span>/</span>
          <span className="text-primary">Vendas</span>
        </div>

        {/* Navigation tabs principais */}
        <OMSNav />

        {/* Sub-navegação de Pedidos */}
        <MLOrdersNav />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reclamações</h1>
            <p className="text-muted-foreground">
              Gerencie claims e mediações do Mercado Livre
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle Auto-Refresh */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefreshEnabled}
                onCheckedChange={setAutoRefreshEnabled}
                disabled={!shouldFetch}
              />
              <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                Auto-refresh (30s)
              </Label>
            </div>
            
            <ReclamacoesExport 
              reclamacoes={reclamacoesWithAnalise} 
              disabled={isLoading || isRefreshing || isLoadingIncremental}
            />
            
            {Object.keys(dadosInMemory).length > 0 && (
              <Button
                onClick={handleLimparDados}
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar ({Object.keys(dadosInMemory).length})
              </Button>
            )}
            
            <Button
              onClick={refresh}
              disabled={isRefreshing || isLoadingIncremental || selectedAccountIds.length === 0}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isLoadingIncremental) ? 'animate-spin' : ''}`} />
              {isRefreshing || isLoadingIncremental ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Barra de Filtros Compacta */}
        <Card className="p-6">
          <ReclamacoesFilterBar
            accounts={mlAccounts}
            selectedAccountIds={selectedAccountIds}
            onAccountsChange={setSelectedAccountIds}
            periodo={filters.periodo}
            onPeriodoChange={(periodo) => setFilters({ ...filters, periodo })}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Botão Filtros Avançados */}
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} filtros avançados
            </Button>

            {hasActiveAdvancedFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAdvancedFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar filtros avançados
              </Button>
            )}
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t">
              <ReclamacoesFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          {/* Botão Buscar */}
          <div className="mt-4 flex justify-end gap-2">
            {isLoading && (
              <Button
                onClick={cancelFetch}
                variant="destructive"
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            
            <Button
              onClick={handleBuscar}
              disabled={isLoading || selectedAccountIds.length === 0}
              size="lg"
              className="min-w-40"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Aplicar Filtros e Buscar
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Stats - só mostrar se tiver dados */}
        {!isLoading && reclamacoesWithAnalise.length > 0 && (
          <ReclamacoesStats reclamacoes={reclamacoesWithAnalise} />
        )}

        {/* Conteúdo principal com Tabs */}
        {hasIntegrationError ? (
          <ReclamacoesEmptyState type="no-integration" message={error || undefined} />
        ) : error && Object.keys(dadosInMemory).length === 0 ? (
          <ReclamacoesEmptyState type="error" message={error} />
        ) : !isLoading && Object.keys(dadosInMemory).length === 0 ? (
          <ReclamacoesEmptyState type="no-data" />
        ) : Object.keys(dadosInMemory).length > 0 ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ativas' | 'historico')}>
            <TabsList className="mb-4">
              <TabsTrigger value="ativas">
                Ativas ({reclamacoesAtivas.length})
              </TabsTrigger>
              <TabsTrigger value="historico">
                Histórico ({reclamacoesHistorico.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ativas">
              <Card>
                <ReclamacoesTable
                  reclamacoes={reclamacoesAtivas}
                  isLoading={false}
                  error={error}
                  pagination={paginacaoCalculada}
                  onPageChange={(page) => setLocalPagination(prev => ({ ...prev, currentPage: page }))}
                  onItemsPerPageChange={(items) => setLocalPagination({ currentPage: 1, itemsPerPage: items })}
                  onStatusChange={handleStatusChange}
                />
              </Card>
            </TabsContent>

            <TabsContent value="historico">
              <Card>
                <ReclamacoesTable
                  reclamacoes={reclamacoesHistorico}
                  isLoading={false}
                  error={error}
                  pagination={paginacaoCalculada}
                  onPageChange={(page) => setLocalPagination(prev => ({ ...prev, currentPage: page }))}
                  onItemsPerPageChange={(items) => setLocalPagination({ currentPage: 1, itemsPerPage: items })}
                  onStatusChange={handleStatusChange}
                />
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}
      </div>
    </ErrorBoundary>
  );
}
