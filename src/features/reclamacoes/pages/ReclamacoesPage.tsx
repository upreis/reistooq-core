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
import { ReclamacoesFilterBarCascata } from '../components/ReclamacoesFilterBarCascata';
import { ReclamacoesFilters } from '../components/ReclamacoesFilters';
import { ReclamacoesTable } from '../components/ReclamacoesTable';
import { ReclamacoesStats } from '../components/ReclamacoesStats';
import { ReclamacoesExport } from '../components/ReclamacoesExport';
import { ReclamacoesEmptyState } from '../components/ReclamacoesEmptyState';
import { ReclamacoesLifecycleAlert } from '../components/ReclamacoesLifecycleAlert';
import { ReclamacoesLifecycleQuickFilter } from '../components/ReclamacoesLifecycleQuickFilter';
import { ReclamacoesAnotacoesModal } from '../components/modals/ReclamacoesAnotacoesModal';
import { Card } from '@/components/ui/card';
import { calcularStatusCiclo } from '../utils/reclamacaoLifecycle';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(3600000); // 1 hora em ms (padrão)
  const [activeTab, setActiveTab] = useState<'ativas' | 'historico'>('ativas');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  // ⚡ USAR useRef para evitar loop infinito ao atualizar dados filtrados
  const filteredReclamacoesRef = React.useRef<any[]>([]);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [lifecycleFilter, setLifecycleFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);
  
  
  // 💾 PERSISTÊNCIA COM LOCALSTORAGE
  const {
    dadosInMemory,
    setDadosInMemory,
    analiseStatus,
    setAnaliseStatus,
    anotacoes,
    saveAnotacao,
    clearOldData,
    clearStorage,
    removeReclamacao
  } = useReclamacoesStorage();

  // Estado do modal de anotações
  const [anotacoesModalOpen, setAnotacoesModalOpen] = useState(false);
  const [selectedClaimForAnotacoes, setSelectedClaimForAnotacoes] = useState<any | null>(null);

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

  // 🔄 Auto-refresh INCREMENTAL configurável (mínimo 1 hora)
  React.useEffect(() => {
    if (!autoRefreshEnabled || !shouldFetch) {
      console.log('⏸️ Auto-refresh pausado:', { autoRefreshEnabled, shouldFetch });
      return;
    }
    
    const intervalMs = Math.max(autoRefreshInterval, 3600000); // Mínimo de 1 hora
    console.log(`🔄 Auto-refresh ativo: ${intervalMs / 60000} minutos (${intervalMs / 3600000}h)`);
    
    const interval = setInterval(async () => {
      console.log(`🔄 Auto-refresh executando (intervalo: ${intervalMs / 60000} minutos)...`);
      
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
    }, intervalMs);

    return () => {
      clearInterval(interval);
      console.log('🛑 Auto-refresh desativado');
    };
  }, [autoRefreshEnabled, shouldFetch, selectedAccountIds, filters.status, filters.type, fetchIncremental, setDadosInMemory, autoRefreshInterval]);

  // 🔥 MERGE de dados da API com in-memory (mantém histórico + detecta mudanças)
  // ✅ USAR TODOS OS DADOS (allRawClaims) não apenas a página atual
  // ⚡ COM DEBOUNCE para evitar múltiplas gravações
  React.useEffect(() => {
    if (allRawClaims.length > 0) {
      console.log(`💾 Preparando para salvar ${allRawClaims.length} reclamações...`);
      
      // Debounce: esperar 500ms antes de salvar
      const timeoutId = setTimeout(() => {
        setDadosInMemory(prevData => {
          const newData = { ...prevData };
          const agora = new Date().toISOString();
          const idsBuscaAtual = new Set<string>();

          allRawClaims.forEach((claim: any) => {
            const claimId = claim.claim_id;
            idsBuscaAtual.add(claimId);
            const existing = newData[claimId];

            if (!existing) {
              newData[claimId] = {
                ...claim,
                primeira_vez_visto: agora,
                ultima_busca: agora,
                campos_atualizados: [],
                snapshot_anterior: null
              };
            } else {
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
                ultima_busca: agora,
                campos_atualizados: camposAtualizados.length > 0 
                  ? camposAtualizados 
                  : (existing.campos_atualizados || []),
                snapshot_anterior: camposAtualizados.length > 0 ? existing : existing.snapshot_anterior,
                ultima_atualizacao_real: camposAtualizados.length > 0 ? agora : existing.ultima_atualizacao_real
              };
            }
          });

          console.log(`✅ Salvamento concluído: ${Object.keys(newData).length} registros`);
          console.log(`📋 Busca atual: ${idsBuscaAtual.size} | 📚 Total histórico: ${Object.keys(newData).length}`);
          
          return newData;
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [allRawClaims]);

  // Converter dados in-memory para array e aplicar análise
  // ✅ PRÉ-CALCULAR STATUS DE CICLO DE VIDA UMA ÚNICA VEZ
  const reclamacoesWithAnalise = useMemo(() => {
    const dataArray = Object.values(dadosInMemory);
    
    return dataArray
      .map((claim: any) => {
        // ⚡ Calcular status do ciclo de vida uma única vez
        const lifecycleStatus = calcularStatusCiclo(claim);
        
        return {
          ...claim,
          status_analise: analiseStatus[claim.claim_id] || 'pendente',
          // 🎯 Armazenar resultado do cálculo para reutilização
          _lifecycleStatus: lifecycleStatus
        };
      })
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

  // Handler de exclusão de reclamação
  const handleDeleteReclamacao = (claimId: string) => {
    if (confirm(`Tem certeza que deseja excluir a reclamação ${claimId}?`)) {
      removeReclamacao(claimId);
      toast({
        title: 'Reclamação excluída',
        description: `Reclamação ${claimId} foi removida com sucesso`
      });
    }
  };

  // Handler de abertura do modal de anotações
  const handleOpenAnotacoes = (claim: any) => {
    setSelectedClaimForAnotacoes(claim);
    setAnotacoesModalOpen(true);
  };

  // Filtrar por aba ativa - usa dados filtrados se houver filtros aplicados
  const dadosParaFiltrar = filteredReclamacoesRef.current.length > 0 ? filteredReclamacoesRef.current : reclamacoesWithAnalise;
  
  // Aplicar filtro de ciclo de vida
  // ⚡ USAR STATUS PRÉ-CALCULADO (_lifecycleStatus)
  const dadosComLifecycleFilter = useMemo(() => {
    if (!lifecycleFilter) return dadosParaFiltrar;

    return dadosParaFiltrar.filter((claim: any) => {
      // ✅ Reutilizar status já calculado
      const status = claim._lifecycleStatus;
      if (!status) return true;
      
      switch (lifecycleFilter) {
        case 'critical':
          return status.statusCiclo === 'critica';
        case 'urgent':
          return status.statusCiclo === 'urgente';
        case 'attention':
          return status.statusCiclo === 'atencao';
        default:
          return true;
      }
    });
  }, [dadosParaFiltrar, lifecycleFilter]);
  
  const reclamacoesAtivas = useMemo(() => {
    return dadosComLifecycleFilter.filter((claim: any) => 
      ACTIVE_STATUSES.includes(claim.status_analise)
    );
  }, [dadosComLifecycleFilter]);

  const reclamacoesHistorico = useMemo(() => {
    return dadosComLifecycleFilter.filter((claim: any) => 
      HISTORIC_STATUSES.includes(claim.status_analise)
    );
  }, [dadosComLifecycleFilter]);

  const reclamacoes = activeTab === 'ativas' ? reclamacoesAtivas : reclamacoesHistorico;
  
  // Calcular contadores para o filtro rápido
  // ⚡ USAR STATUS PRÉ-CALCULADO
  const lifecycleCounts = useMemo(() => {
    const counts = { critical: 0, urgent: 0, attention: 0 };
    
    dadosParaFiltrar.forEach((claim: any) => {
      // ✅ Reutilizar status já calculado
      const status = claim._lifecycleStatus;
      if (!status) return;
      
      if (status.statusCiclo === 'critica') counts.critical++;
      else if (status.statusCiclo === 'urgente') counts.urgent++;
      else if (status.statusCiclo === 'atencao') counts.attention++;
    });
    
    return counts;
  }, [dadosParaFiltrar]);


  const handleBuscar = () => {
    if (selectedAccountIds.length === 0) {
      return;
    }
    setHasLoadedFromStorage(true); // Marcar que iniciou uma busca
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

        {/* Barra de Filtros Cascata */}
        {!isLoading && reclamacoesWithAnalise.length > 0 && (
          <ReclamacoesFilterBarCascata 
            reclamacoes={reclamacoesWithAnalise}
            onFilteredDataChange={(data) => {
              filteredReclamacoesRef.current = data;
              forceUpdate(); // Forçar re-render quando filtros mudarem
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reclamações</h1>
            <p className="text-muted-foreground">
              Gerencie claims e mediações do Mercado Livre
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle Auto-Refresh com configuração de intervalo */}
            <div className="flex items-center gap-3 border rounded-lg px-3 py-2 bg-card">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefreshEnabled}
                  onCheckedChange={setAutoRefreshEnabled}
                />
                <Label 
                  htmlFor="auto-refresh" 
                  className="text-sm cursor-pointer whitespace-nowrap"
                  title={!shouldFetch ? "Clique em 'Aplicar Filtros' primeiro" : ""}
                >
                  Auto-refresh
                </Label>
              </div>
              
              <div className="flex items-center gap-2 border-l pl-3">
                <span className="text-xs text-muted-foreground whitespace-nowrap">A cada:</span>
                <Select
                  value={autoRefreshInterval.toString()}
                  onValueChange={(value) => {
                    const newInterval = Number(value);
                    console.log(`⏱️ Intervalo alterado: ${newInterval / 60000} minutos (${newInterval / 3600000}h)`);
                    setAutoRefreshInterval(newInterval);
                  }}
                  disabled={!autoRefreshEnabled}
                >
                  <SelectTrigger className="w-[110px] h-8 text-xs bg-background">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg z-[100]">
                    <SelectItem value="3600000">1 hora</SelectItem>
                    <SelectItem value="7200000">2 horas</SelectItem>
                    <SelectItem value="14400000">4 horas</SelectItem>
                    <SelectItem value="21600000">6 horas</SelectItem>
                    <SelectItem value="43200000">12 horas</SelectItem>
                    <SelectItem value="86400000">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            onBuscar={handleBuscar}
            isLoading={isLoading}
            onCancel={cancelFetch}
          />
        </Card>


        {/* Filtro Rápido de Ciclo de Vida */}
        {!isLoading && reclamacoesWithAnalise.length > 0 && (
          <ReclamacoesLifecycleQuickFilter
            onFilterChange={setLifecycleFilter}
            counts={lifecycleCounts}
          />
        )}

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
                  onStatusChange={handleStatusChange}
                  onDeleteReclamacao={handleDeleteReclamacao}
                  onOpenAnotacoes={handleOpenAnotacoes}
                  anotacoes={anotacoes}
                />
              </Card>
            </TabsContent>

            <TabsContent value="historico">
              <Card>
                <ReclamacoesTable
                  reclamacoes={reclamacoesHistorico}
                  isLoading={false}
                  error={error}
                  onStatusChange={handleStatusChange}
                  onDeleteReclamacao={handleDeleteReclamacao}
                  onOpenAnotacoes={handleOpenAnotacoes}
                  anotacoes={anotacoes}
                />
              </Card>
            </TabsContent>
          </Tabs>
        ) : null}

        {/* Modal de Anotações */}
        {selectedClaimForAnotacoes && (
          <ReclamacoesAnotacoesModal
            open={anotacoesModalOpen}
            onOpenChange={setAnotacoesModalOpen}
            claimId={selectedClaimForAnotacoes.claim_id}
            orderId={selectedClaimForAnotacoes.order_id}
            anotacaoAtual={anotacoes[selectedClaimForAnotacoes.claim_id] || ''}
            onSave={saveAnotacao}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
