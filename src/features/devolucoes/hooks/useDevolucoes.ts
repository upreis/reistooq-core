/**
 * 🎯 HOOK PRINCIPAL OTIMIZADO DE DEVOLUÇÕES
 * Versão com performance melhorada e controles avançados
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDevolucoesBusca, DevolucaoBuscaFilters } from './useDevolucoesBusca';
import { applyAllFilters } from '../utils/FilterUtils';
import { 
  loadFiltersFromStorage, 
  saveFiltersToStorage, 
  removeFiltersFromStorage, 
  createCleanFilters,
  createInitialFilters 
} from '../utils/LocalStorageUtils';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

export interface DevolucaoFilters {
  searchTerm: string;
  status: string;
  periodoDias: number;  // Sempre usa item.date_created
}

export interface DevolucaoAdvancedFilters extends DevolucaoBuscaFilters {
  // 🔍 BUSCA
  searchTerm: string;
  
  // 📊 CONTAS
  contasSelecionadas: string[];
  
  // 📅 DATAS - Sempre usa item.date_created (coluna "Data Criação")
  periodoDias: number;  // 0 = todas, 7, 15, 30, 60, 90
  
  // 🎯 STATUS E CLASSIFICAÇÃO
  tipoClaim: string;
  subtipoClaim: string;
  motivoCategoria: string;
  
  // 💰 FINANCEIRO
  valorRetidoMin: string;
  valorRetidoMax: string;
  tipoReembolso: string;
  responsavelCusto: string;
  
  // 🚚 RASTREAMENTO
  temRastreamento: string;
  statusRastreamento: string;
  transportadora: string;
  
  // 📎 ANEXOS E COMUNICAÇÃO
  temAnexos: string;
  mensagensNaoLidasMin: string;
  
  // ⚠️ PRIORIDADE E AÇÃO
  nivelPrioridade: string;
  acaoSellerNecessaria: string;
  escaladoParaML: string;
  emMediacao: string;
  
  // ⏰ PRAZOS
  prazoVencido: string;
  slaNaoCumprido: string;
  
  // 📈 MÉTRICAS
  eficienciaResolucao: string;
  scoreQualidadeMin: string;
  
  // CONTROLE
  buscarEmTempoReal: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
}

export interface PerformanceSettings {
  enableLazyLoading: boolean;
  chunkSize: number;
  debounceDelay: number;
}

export function useDevolucoes(mlAccounts: any[], selectedAccountId?: string, selectedAccountIds?: string[]) {
  // Estados principais
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // 📊 Estados de progresso
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, percentage: 0 });
  
  // 🎯 FILTROS UNIFICADOS COM LOCALSTORAGE
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>(() => {
    return createInitialFilters(selectedAccountId, selectedAccountIds, mlAccounts);
  });

  // Estados para controle de mudanças pendentes
  const [draftFilters, setDraftFilters] = useState<DevolucaoAdvancedFilters | null>(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Configurações de performance otimizadas (fixas)
  const performanceSettings: PerformanceSettings = {
    enableLazyLoading: false, // Desabilitado para paginação tradicional
    chunkSize: 100, // 100 itens por página
    debounceDelay: 300 // Delay otimizado para responsividade
  };

  // ⚠️ HOOKS DEVEM SER CHAMADOS SEMPRE NA MESMA ORDEM - MOVER PARA O TOPO
  const busca = useDevolucoesBusca();
  const debouncedSearchTerm = useDebounce(advancedFilters.searchTerm, performanceSettings.debounceDelay);
  
  // ✅ 1.4 - CORREÇÃO: Estados de carregamento - REMOVER loading duplicado
  // const [loading, setLoading] = useState(false); // ❌ DELETADO - usar apenas busca.loading
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh DESABILITADO - usuário controla manualmente
  const autoRefresh = {
    isRefreshing: false,
    lastRefresh: null,
    nextRefresh: null,
    retryCount: 0,
    timeUntilRefresh: null,
    manualRefresh: async () => {},
    pauseRefresh: () => {},
    resumeRefresh: () => {}
  };

  // ✅ Filtrar dados localmente usando FilterUtils (fonte única de verdade)
  const devolucoesFiltradas = useMemo(() => {
    console.log('[useDevolucoes] 🔄 Recalculando devolucoesFiltradas:', {
      devolucoesLength: devolucoes.length,
      filters: advancedFilters,
      debouncedSearchTerm
    });
    
    const resultado = applyAllFilters(devolucoes, advancedFilters, debouncedSearchTerm, {
      logPerformance: import.meta.env.DEV
    });
    
    console.log('[useDevolucoes] ✅ devolucoesFiltradas calculadas:', {
      total: devolucoes.length,
      filtradas: resultado.length
    });
    
    return resultado;
  }, [devolucoes, debouncedSearchTerm, advancedFilters]);

  // Paginação manual (sem lazy loading)

  // Atualizar contas selecionadas quando selectedAccountId mudar SEM buscar automaticamente
  useEffect(() => {
    if (selectedAccountId && advancedFilters.contasSelecionadas[0] !== selectedAccountId) {
      setAdvancedFilters(prev => ({
        ...prev,
        contasSelecionadas: [selectedAccountId]
      }));
    }
  }, [selectedAccountId]);

  // ✅ INICIALIZAÇÃO LIMPA - Sem persistência de datas
  useEffect(() => {
    if (!mlAccounts?.length) return;

    // Configurar contas ativas automaticamente APENAS se não tiver selectedAccountId
    if (!selectedAccountId) {
      const contasAtivas = mlAccounts.filter(acc => acc.is_active);
      if (contasAtivas.length > 0 && advancedFilters.contasSelecionadas.length === 0) {
        setAdvancedFilters(prev => ({
          ...prev,
          contasSelecionadas: contasAtivas.map(acc => acc.id)
        }));
      }
    }
    
    console.log('[useDevolucoes] ✅ Inicialização sem dados persistidos - tela limpa');
  }, [mlAccounts, selectedAccountId]);



  // 🔍 BUSCAR COM FILTROS - LIMPAR TELA E BUSCAR APENAS DA API ML
  const buscarComFiltros = useCallback(async (filtrosImediatos?: DevolucaoAdvancedFilters) => {
    try {
      setError(null);
      
      // 🧹 LIMPAR TELA IMEDIATAMENTE quando usuário clicar "Buscar"
      setDevolucoes([]);
      setLoadingProgress({ current: 0, total: 0, percentage: 0 });
      
      // Usar filtros passados diretamente ou os do estado atual
      const filtrosParaUsar = filtrosImediatos || advancedFilters;
      
      logger.info('[useDevolucoes] 🌐 Limpando tela e buscando APENAS da API ML...', {
        periodoDias: filtrosParaUsar.periodoDias || 0,
        contas: filtrosParaUsar.contasSelecionadas
      });
      
      toast.info('Buscando dados novos da API ML...');
      
      // ✅ Buscar APENAS da API ML (não do banco)
      const dadosAPI = await busca.buscarDaAPI(filtrosParaUsar, mlAccounts);
      
      console.log('[useDevolucoes] 🔍 DEBUG - Dados retornados da API:', {
        length: dadosAPI?.length || 0,
        isArray: Array.isArray(dadosAPI),
        firstItem: dadosAPI?.[0]?.order_id,
        primeiroObjeto: dadosAPI?.[0],
        temDataCriacao: dadosAPI?.[0]?.data_criacao ? 'SIM' : 'NÃO'
      });
      
      setDevolucoes(dadosAPI);
      setCurrentPage(1);
      
      logger.info(`[useDevolucoes] ✅ ${dadosAPI.length} devoluções atualizadas da API`);
      toast.success(`${dadosAPI.length} devoluções encontradas!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar devoluções';
      setError(errorMessage);
      logger.error('[useDevolucoes] ❌ Erro ao buscar com filtros:', err);
      toast.error('Erro ao buscar devoluções');
    }
  }, [busca, advancedFilters, mlAccounts]);

  // Remover sincronização automática com banco
  // const sincronizarDevolucoes = ...

  // ✅ BUSCA AUTOMÁTICA INICIAL quando contas são selecionadas
  useEffect(() => {
    const contasValidas = advancedFilters.contasSelecionadas.filter(Boolean);
    
    if (contasValidas.length > 0 && devolucoes.length === 0 && !busca.loading) {
      logger.info('[useDevolucoes] 🚀 Busca automática inicial - contas selecionadas:', contasValidas);
      buscarComFiltros();
    } else {
      logger.info('[useDevolucoes] ⏸️ Aguardando condições para busca:', {
        temContas: contasValidas.length > 0,
        semDados: devolucoes.length === 0,
        naoCarregando: !busca.loading
      });
    }
  }, [advancedFilters.contasSelecionadas, mlAccounts]);

  // 🔄 Atualizar contas selecionadas quando selectedAccountIds mudar
  useEffect(() => {
    if (selectedAccountIds && selectedAccountIds.length > 0) {
      setAdvancedFilters(prev => ({
        ...prev,
        contasSelecionadas: selectedAccountIds
      }));
    }
  }, [selectedAccountIds]);

  // ✏️ ATUALIZAR DRAFT DE FILTROS (mudanças pendentes)
  const updateDraftFilters = useCallback((key: string, value: any) => {
    setDraftFilters(prev => ({
      ...(prev || advancedFilters),
      [key]: value
    }));
  }, [advancedFilters]);

  // ✏️ APLICAR FILTROS E SALVAR
  const applyFilters = useCallback(async () => {
    setIsApplyingFilters(true);
    try {
      const filtrosParaAplicar = draftFilters || advancedFilters;
      
      // Atualizar estado de filtros aplicados
      setAdvancedFilters(filtrosParaAplicar);
      setDraftFilters(null);
      
      // Salvar no localStorage
      saveFiltersToStorage(filtrosParaAplicar);
      
      // Buscar com os filtros
      await buscarComFiltros(filtrosParaAplicar);
      
      return true;
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      throw error;
    } finally {
      setIsApplyingFilters(false);
    }
  }, [advancedFilters, draftFilters, buscarComFiltros]);

  // ✏️ CANCELAR MUDANÇAS PENDENTES
  const cancelDraftFilters = useCallback(() => {
    setDraftFilters(null);
  }, []);

  // ✏️ COMPATIBILIDADE: Manter updateAdvancedFilters para código legado
  const updateAdvancedFilters = useCallback((newFilters: Partial<DevolucaoAdvancedFilters>) => {
    setAdvancedFilters(prev => {
      const filtrosAtualizados = { ...prev, ...newFilters };
      console.log('[useDevolucoes] ✏️ Filtros atualizados (apenas em memória):', filtrosAtualizados);
      return filtrosAtualizados;
    });
  }, []);

  // Atualizar configurações de performance removido - valores fixos otimizados

  // 🗑️ LIMPAR FILTROS - Resetar tudo e limpar tela
  const clearFilters = useCallback(() => {
    const filtrosLimpos = createCleanFilters(mlAccounts);
    
    setAdvancedFilters(filtrosLimpos);
    setDraftFilters(null);
    setDevolucoes([]); // 🧹 Limpar dados da tela
    setCurrentPage(1);
    
    // Limpar do localStorage
    removeFiltersFromStorage();
    
    toast.info('Filtros limpos. Use "Buscar" para carregar novos dados.');
    console.log('[useDevolucoes] 🗑️ Filtros e dados limpos - tela vazia');
  }, [mlAccounts]);

  // Paginação otimizada
  const totalPages = Math.ceil(devolucoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Paginação tradicional
  const devolucoesPaginadas = devolucoesFiltradas.slice(startIndex, startIndex + itemsPerPage);
  
  // Handler para mudança de itens por página
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset para primeira página
  }, []);

  // Estatísticas otimizadas
  const stats = useMemo(() => ({
    total: devolucoesFiltradas.length,
    pendentes: devolucoesFiltradas.filter(d => d.status_devolucao === 'with_claims').length,
    concluidas: devolucoesFiltradas.filter(d => d.status_devolucao === 'completed').length,
    canceladas: devolucoesFiltradas.filter(d => d.status_devolucao === 'cancelled').length,
    // Performance stats
    totalLoaded: devolucoes.length,
    filtered: devolucoesFiltradas.length,
    visible: devolucoesPaginadas.length
  }), [devolucoesFiltradas, devolucoes.length, devolucoesPaginadas.length]);

  // Toggle analytics
  const toggleAnalytics = useCallback(() => {
    setShowAnalytics(prev => !prev);
  }, []);

  // 🛑 Cancelar busca em andamento
  const cancelarBusca = useCallback(() => {
    busca.cancelarBusca();
    setDevolucoes([]);
    setIsApplyingFilters(false);
    toast.info('Busca cancelada');
  }, [busca]);

  return {
    // Dados
    devolucoes: devolucoesPaginadas,
    devolucoesFiltradas,
    devolucoesPaginadas,
    stats,
    
    // Estados
    loading: busca.loading, // ✅ 1.4 - CORREÇÃO: Fonte única de verdade
    loadingProgress, // 📊 Progresso de carregamento
    isRefreshing: false,
    error: error,
    currentPage,
    totalPages,
    itemsPerPage,
    showAnalytics,
    
    // Filtros unificados
    filters: advancedFilters, // Compatibilidade
    advancedFilters,
    draftFilters,
    isApplyingFilters,
    hasPendingChanges: draftFilters !== null,
    performanceSettings,
    
    // Ações de filtros
    updateFilters: updateAdvancedFilters, // Compatibilidade  
    updateAdvancedFilters,
    updateDraftFilters,
    applyFilters,
    cancelDraftFilters,
    clearFilters,
    
    // Ações (somente API)
    buscarComFiltros,
    cancelarBusca,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
    toggleAnalytics,
    clearError: () => setError(null),
    
    // Performance & Auto-refresh
    autoRefresh,
    
    // 🎯 Cache stats apenas (loadingProgress já foi exportado acima)
    cacheStats: busca.cacheStats,
    clearCache: busca.clearCache
  };
}