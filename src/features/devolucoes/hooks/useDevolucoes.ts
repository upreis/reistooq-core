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

export interface DevolucaoFilters {
  searchTerm: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

export interface DevolucaoAdvancedFilters extends DevolucaoBuscaFilters {
  // 🔍 BUSCA
  searchTerm: string;
  
  // 📊 CONTAS
  contasSelecionadas: string[];
  
  // 📅 DATAS
  dataInicio: string;
  dataFim: string;
  
  // 🎯 STATUS E CLASSIFICAÇÃO
  statusClaim: string;
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

  // Filtrar dados localmente com debounce (usando função centralizada)
  const devolucoesFiltradas = useMemo(() => {
    return applyAllFilters(devolucoes, advancedFilters, debouncedSearchTerm);
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


  // 🔍 BUSCAR COM FILTROS - Aceita filtros opcionais para evitar race conditions
  const buscarComFiltros = useCallback(async (filtrosImediatos?: DevolucaoAdvancedFilters) => {
    try {
      // ✅ 1.4 - CORREÇÃO: Não usar setLoading local (já gerenciado por busca)
      setError(null);
      
      // Usar filtros passados diretamente ou os do estado atual
      const filtrosParaUsar = filtrosImediatos || advancedFilters;
      
      // ✅ BUSCA SEM OBRIGATORIEDADE DE FILTRO DE DATA
      console.log('[useDevolucoes] 🔍 Buscando com filtros:', {
        dataInicio: filtrosParaUsar.dataInicio || 'SEM FILTRO',
        dataFim: filtrosParaUsar.dataFim || 'SEM FILTRO',
        contas: filtrosParaUsar.contasSelecionadas,
        origem: filtrosImediatos ? 'filtros imediatos' : 'estado atual'
      });
      
      const dadosAPI = await busca.buscarDaAPI(filtrosParaUsar, mlAccounts);
      setDevolucoes(dadosAPI);
      setCurrentPage(1);
      
      console.log(`[useDevolucoes] ✅ ${dadosAPI.length} devoluções buscadas`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar devoluções';
      setError(errorMessage);
      console.error('[useDevolucoes] ❌ Erro:', err);
    } // ✅ 1.4 - CORREÇÃO: Remover finally setLoading (já gerenciado por busca)
  }, [busca, advancedFilters, mlAccounts]);

  // Remover sincronização automática com banco
  // const sincronizarDevolucoes = ...

  // Busca automática inicial REMOVIDA - usuário deve clicar em "Aplicar Filtros"
  // A busca agora é totalmente controlada pelo usuário através do botão

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

  // 🗑️ LIMPAR FILTROS - Resetar tudo
  const clearFilters = useCallback(() => {
    const filtrosLimpos = createCleanFilters(mlAccounts);
    
    setAdvancedFilters(filtrosLimpos);
    setDraftFilters(null);
    setDevolucoes([]);
    setCurrentPage(1);
    
    // Limpar do localStorage
    removeFiltersFromStorage();
    
    console.log('[useDevolucoes] 🗑️ Filtros e dados limpos');
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

  return {
    // Dados
    devolucoes: devolucoesPaginadas,
    devolucoesFiltradas,
    devolucoesPaginadas,
    stats,
    
    // Estados
    loading: busca.loading, // ✅ 1.4 - CORREÇÃO: Fonte única de verdade
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
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,
    toggleAnalytics,
    clearError: () => setError(null),
    
    // Performance & Auto-refresh
    autoRefresh,
    
    // 🎯 FASE 4: Novos campos para UI/UX
    loadingProgress: busca.loadingProgress,
    cacheStats: busca.cacheStats,
    clearCache: busca.clearCache
  };
}