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
// validateMLAccounts removido temporariamente
const validateMLAccounts = (mlAccounts: any[]) => ({ 
  valid: mlAccounts.length > 0, 
  accountIds: mlAccounts.map(acc => acc.id), 
  error: null 
});
import { logger } from '@/utils/logger';
import { MLOrdersNav } from '@/features/ml/components/MLOrdersNav';
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
  const [lifecycleFilter, setLifecycleFilter] = useState<'critical' | 'urgent' | 'attention' | null>(null);
  
  // 🎯 ETAPA 1: Estado para armazenar dados filtrados pelos filtros rápidos (empresa, tipo, status, etc.)
  const [filteredByQuickFilter, setFilteredByQuickFilter] = useState<any[]>([]);
  
  // ✅ FASE 4.1: Filtros em cascata aplicados diretamente no componente filho
  
  
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

  // ✅ CORREÇÃO ANTI-LOOP: Auto-selecionar contas APENAS UMA VEZ
  React.useEffect(() => {
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
  }, [mlAccounts]); // ✅ CRÍTICO: Remover selectedAccountIds.length das dependências

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

  // ✅ CORREÇÃO ANTI-LOOP: Ref para controlar se interval já foi criado
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastAutoRefreshConfig = React.useRef<string>('');
  
  // 🔄 Auto-refresh INCREMENTAL configurável (mínimo 1 hora)
  React.useEffect(() => {
    // ✅ Gerar hash de configuração para evitar recriar interval desnecessariamente
    const config = JSON.stringify({
      enabled: autoRefreshEnabled,
      shouldFetch,
      interval: autoRefreshInterval,
      accounts: selectedAccountIds.sort(),
      status: filters.status,
      type: filters.type
    });
    
    // ✅ Se configuração não mudou, não fazer nada
    if (config === lastAutoRefreshConfig.current && intervalRef.current) {
      return;
    }
    
    lastAutoRefreshConfig.current = config;
    
    // ✅ Limpar interval anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (!autoRefreshEnabled || !shouldFetch) {
      console.log('⏸️ Auto-refresh pausado:', { autoRefreshEnabled, shouldFetch });
      return;
    }
    
    const intervalMs = Math.max(autoRefreshInterval, 3600000); // Mínimo de 1 hora
    console.log(`🔄 Auto-refresh ativo: ${intervalMs / 60000} minutos (${intervalMs / 3600000}h)`);
    
    intervalRef.current = setInterval(async () => {
      console.log(`🔄 Auto-refresh executando (intervalo: ${intervalMs / 60000} minutos)...`);
      
      // ✅ SEMPRE usar 60 dias no auto-refresh
      const dataInicio60Dias = new Date();
      dataInicio60Dias.setDate(dataInicio60Dias.getDate() - 60);
      
      try {
        const { newClaims, updatedClaims } = await fetchIncremental({
          selectedAccountIds,
          filters: {
            status: filters.status,
            type: filters.type,
            date_from: dataInicio60Dias.toISOString(),
            date_to: new Date().toISOString()
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
                newData[claimId] = {
                  ...claim,
                  primeira_vez_visto: agora,
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
      } catch (error) {
        console.error('❌ Erro no auto-refresh:', error);
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('🛑 Auto-refresh desativado');
      }
    };
  }, [autoRefreshEnabled, shouldFetch, autoRefreshInterval]); // ✅ CRÍTICO: Remover deps que causam loop

  // 🔥 MERGE de dados da API com in-memory (mantém histórico + detecta mudanças)
  // ✅ USAR TODOS OS DADOS (allRawClaims) não apenas a página atual
  // ⚡ CORREÇÃO ANTI-LOOP: Usar ref para controlar se merge já foi executado
  const lastSaveHashRef = React.useRef<string>('');
  const mergeTimeoutRef = React.useRef<NodeJS.Timeout>();
  
  React.useEffect(() => {
    // ✅ Limpar timeout anterior se existir
    if (mergeTimeoutRef.current) {
      clearTimeout(mergeTimeoutRef.current);
    }
    
    if (allRawClaims.length === 0) return;
    
    // ⚡ PROTEÇÃO INTELIGENTE: Comparar hash dos dados
    const currentHash = allRawClaims.map(c => c.claim_id).sort().join('|');
    
    if (currentHash === lastSaveHashRef.current) {
      return; // Dados idênticos, não fazer nada
    }
    
    // Debounce: esperar 1000ms antes de salvar (aumentado de 500ms para evitar salvar muito frequentemente)
    mergeTimeoutRef.current = setTimeout(() => {
      lastSaveHashRef.current = currentHash;
      
      setDadosInMemory(prevData => {
        const newData = { ...prevData };
        const agoraISO = new Date().toISOString();

        allRawClaims.forEach((claim: any) => {
          const claimId = claim.claim_id;
          const existing = newData[claimId];

          if (!existing) {
            newData[claimId] = {
              ...claim,
              primeira_vez_visto: agoraISO,
              ultima_busca: agoraISO,
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
                  data_mudanca: agoraISO
                });
              }
            }

            newData[claimId] = {
              ...claim,
              primeira_vez_visto: existing.primeira_vez_visto,
              ultima_busca: agoraISO,
              campos_atualizados: camposAtualizados.length > 0 
                ? camposAtualizados 
                : (existing.campos_atualizados || []),
              snapshot_anterior: camposAtualizados.length > 0 ? existing : existing.snapshot_anterior,
              ultima_atualizacao_real: camposAtualizados.length > 0 ? agoraISO : existing.ultima_atualizacao_real
            };
          }
        });

        console.log(`✅ Merge concluído: ${Object.keys(newData).length} registros`);
        return newData;
      });
    }, 1000);

    return () => {
      if (mergeTimeoutRef.current) {
        clearTimeout(mergeTimeoutRef.current);
      }
    };
  }, [allRawClaims]); // ✅ CRÍTICO: Apenas allRawClaims como dependência

  // ✅ FASE 4.1: PRÉ-CALCULAR TUDO UMA ÚNICA VEZ (análise + lifecycle)
  const reclamacoesWithAnalise = useMemo(() => {
    const dataArray = Object.values(dadosInMemory);
    
    return dataArray
      .map((claim: any) => {
        // ⚡ Calcular status do ciclo de vida e análise juntos
        const lifecycleStatus = calcularStatusCiclo(claim);
        
        return {
          ...claim,
          status_analise: analiseStatus[claim.claim_id] || 'pendente',
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

  // ✅ FASE 4.1: Aplicar filtro de ciclo de vida diretamente
  const dadosComLifecycleFilter = useMemo(() => {
    if (!lifecycleFilter) return reclamacoesWithAnalise;

    return reclamacoesWithAnalise.filter((claim: any) => {
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
  }, [reclamacoesWithAnalise, lifecycleFilter]);
  
  // 🎯 ETAPA 3: Determinar fonte de dados (filtro rápido tem prioridade)
  const dadosParaSeparacao = useMemo(() => {
    // Se filtro rápido está ativo (tem dados), usar ele (PRIORIDADE)
    if (filteredByQuickFilter.length > 0) {
      return filteredByQuickFilter;
    }
    // Senão, usar dados com lifecycle filter aplicado (fluxo normal)
    return dadosComLifecycleFilter;
  }, [filteredByQuickFilter, dadosComLifecycleFilter]);

  // ✅ FASE 4.1: Separar ativas/histórico dos dados determinados acima
  const reclamacoesAtivas = useMemo(() => {
    return dadosParaSeparacao.filter((claim: any) => 
      ACTIVE_STATUSES.includes(claim.status_analise)
    );
  }, [dadosParaSeparacao]);

  const reclamacoesHistorico = useMemo(() => {
    return dadosParaSeparacao.filter((claim: any) => 
      HISTORIC_STATUSES.includes(claim.status_analise)
    );
  }, [dadosParaSeparacao]);

  const reclamacoes = activeTab === 'ativas' ? reclamacoesAtivas : reclamacoesHistorico;
  
  // ✅ FASE 4.1: Calcular contadores de lifecycle de forma otimizada
  const lifecycleCounts = useMemo(() => {
    const counts = { critical: 0, urgent: 0, attention: 0 };
    
    reclamacoesWithAnalise.forEach((claim: any) => {
      const status = claim._lifecycleStatus;
      if (!status) return;
      
      if (status.statusCiclo === 'critica') counts.critical++;
      else if (status.statusCiclo === 'urgente') counts.urgent++;
      else if (status.statusCiclo === 'atencao') counts.attention++;
    });
    
    return counts;
  }, [reclamacoesWithAnalise]);


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
        {/* Sub-navegação de Pedidos */}
        <MLOrdersNav />

        {/* Barra de Filtros Cascata */}
        {!isLoading && reclamacoesWithAnalise.length > 0 && (
          <ReclamacoesFilterBarCascata 
            reclamacoes={reclamacoesWithAnalise}
            onFilteredDataChange={(filtered) => {
              // 🎯 ETAPA 2: Atualizar estado com dados filtrados
              console.log(`Filtros rápidos aplicados: ${filtered.length} reclamações`);
              setFilteredByQuickFilter(filtered);
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
