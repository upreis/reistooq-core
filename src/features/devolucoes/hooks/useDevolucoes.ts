/**
 * 🎯 HOOK PRINCIPAL OTIMIZADO DE DEVOLUÇÕES
 * Versão com performance melhorada e controles avançados
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useOptimizedDebounce';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useLazyLoading } from '@/hooks/useLazyLoading';
import { useDevolucoesPersistence } from './useDevolucoesPersistence';
import { useDevolucoesBusca, DevolucaoBuscaFilters } from './useDevolucoesBusca';

export interface DevolucaoFilters {
  searchTerm: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

export interface DevolucaoAdvancedFilters extends DevolucaoBuscaFilters {
  buscarEmTempoReal: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // em segundos
  searchTerm: string; // Campo de busca
}

export interface PerformanceSettings {
  enableLazyLoading: boolean;
  chunkSize: number;
  debounceDelay: number;
}

export function useDevolucoes(mlAccounts: any[], selectedAccountId?: string) {
  // Estados principais
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filtros avançados unificados
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>({
    contasSelecionadas: selectedAccountId ? [selectedAccountId] : [],
    dataInicio: '',
    dataFim: '',
    statusClaim: '',
    searchTerm: '', // Campo de busca unificado
    buscarEmTempoReal: true, // Sempre buscar da API
    autoRefreshEnabled: false,
    autoRefreshInterval: 3600 // 1 hora por padrão
  });

  // Configurações de performance otimizadas (fixas)
  const performanceSettings: PerformanceSettings = {
    enableLazyLoading: true,
    chunkSize: 25, // Tamanho otimizado para boa performance
    debounceDelay: 300 // Delay otimizado para responsividade
  };

  // Hooks
  const persistence = useDevolucoesPersistence();
  const busca = useDevolucoesBusca();

  // Debounce otimizado para busca unificada
  const { 
    debouncedValue: debouncedSearchTerm, 
    flushDebounce 
  } = useDebounce(advancedFilters.searchTerm, performanceSettings.debounceDelay);

  // Busca principal - SEMPRE da API ML 
  const autoRefresh = useAutoRefresh({
    enabled: advancedFilters.autoRefreshEnabled,
    interval: advancedFilters.autoRefreshInterval,
    onRefresh: useCallback(async () => {
      const dadosAPI = await busca.buscarDaAPI(advancedFilters, mlAccounts);
      setDevolucoes(dadosAPI);
      setCurrentPage(1);
      persistence.saveApiData(dadosAPI, advancedFilters);
    }, [advancedFilters, busca, mlAccounts, persistence]),
    maxRetries: 3,
    retryDelay: 10
  });

  // Filtrar dados localmente com debounce
  const devolucoesFiltradas = useMemo(() => {
    let resultados = [...devolucoes];

    if (debouncedSearchTerm) {
      const searchTerm = debouncedSearchTerm.toLowerCase();
      resultados = resultados.filter(dev => 
        dev.produto_titulo?.toLowerCase().includes(searchTerm) ||
        dev.order_id?.toString().includes(searchTerm) ||
        dev.sku?.toLowerCase().includes(searchTerm) ||
        dev.comprador_nickname?.toLowerCase().includes(searchTerm)
      );
    }

    if (advancedFilters.statusClaim) {
      resultados = resultados.filter(dev => dev.status_devolucao === advancedFilters.statusClaim);
    }

    if (advancedFilters.dataInicio) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) >= new Date(advancedFilters.dataInicio)
      );
    }

    if (advancedFilters.dataFim) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) <= new Date(advancedFilters.dataFim)
      );
    }

    return resultados;
  }, [devolucoes, debouncedSearchTerm, advancedFilters]);

  // Lazy loading para grandes datasets
  const lazyLoading = useLazyLoading({
    data: devolucoesFiltradas,
    chunkSize: performanceSettings.chunkSize,
    initialChunks: 2,
    enabled: performanceSettings.enableLazyLoading
  });

  // Atualizar contas selecionadas quando selectedAccountId mudar
  useEffect(() => {
    if (selectedAccountId && advancedFilters.contasSelecionadas[0] !== selectedAccountId) {
      setAdvancedFilters(prev => ({
        ...prev,
        contasSelecionadas: [selectedAccountId]
      }));
    }
  }, [selectedAccountId]);

  // Inicialização sem busca automática do banco
  useEffect(() => {
    if (!persistence.isStateLoaded || !mlAccounts?.length) return;

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

    // Restaurar apenas dados da API se existirem
    if (persistence.hasValidData()) {
      const state = persistence.persistedState!;
      
      // Só restaurar se for dados da API
      if (state.dataSource === 'api') {
        setDevolucoes(state.data);
        setCurrentPage(state.currentPage);
        setAdvancedFilters(prev => ({
          ...prev,
          ...state.searchFilters,
          buscarEmTempoReal: true
        }));
        console.log(`🔄 ${state.data.length} devoluções restauradas da API`);
      }
    }
    
    // Não buscar dados iniciais do banco automaticamente
  }, [persistence.isStateLoaded, mlAccounts]);


  // Buscar com filtros (SOMENTE da API quando acionada)
  const buscarComFiltros = useCallback(async () => {
    flushDebounce(); // Aplicar busca imediatamente
    const dadosAPI = await busca.buscarDaAPI(advancedFilters, mlAccounts);
    setDevolucoes(dadosAPI);
    setCurrentPage(1);
    persistence.saveApiData(dadosAPI, advancedFilters);
  }, [flushDebounce, busca, advancedFilters, mlAccounts, persistence]);

  // Remover sincronização automática com banco
  // const sincronizarDevolucoes = ...

  // Atualizar filtros unificados
  const updateAdvancedFilters = useCallback((newFilters: Partial<DevolucaoAdvancedFilters>) => {
    setAdvancedFilters(prev => ({ ...prev, ...newFilters }));
    
    // Salvar contas selecionadas
    if (newFilters.contasSelecionadas) {
      persistence.saveSelectedAccounts(newFilters.contasSelecionadas);
    }
  }, [persistence]);

  // Atualizar configurações de performance removido - valores fixos otimizados

  // Limpar filtros unificados
  const clearFilters = useCallback(() => {
    setAdvancedFilters({
      contasSelecionadas: mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [],
      searchTerm: '',
      statusClaim: '',
      dataInicio: '',
      dataFim: '',
      buscarEmTempoReal: true, // Sempre true
      autoRefreshEnabled: false,
      autoRefreshInterval: 3600 // 1 hora por padrão
    });
    lazyLoading.reset();
    persistence.clearPersistedState();
  }, [persistence, lazyLoading, mlAccounts]);

  // Paginação otimizada
  const itemsPerPage = performanceSettings.chunkSize;
  const totalPages = Math.ceil(devolucoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Usar lazy loading ou paginação tradicional
  const devolucoesPaginadas = performanceSettings.enableLazyLoading 
    ? lazyLoading.visibleData
    : devolucoesFiltradas.slice(startIndex, startIndex + itemsPerPage);

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
    stats,
    
    // Estados
    loading: busca.loading,
    currentPage,
    totalPages,
    showAnalytics,
    
    // Filtros unificados
    filters: advancedFilters, // Compatibilidade
    advancedFilters,
    performanceSettings,
    updateFilters: updateAdvancedFilters, // Compatibilidade  
    updateAdvancedFilters,
    clearFilters,
    
    // Ações (somente API)
    buscarComFiltros,
    setCurrentPage,
    toggleAnalytics,
    
    // Performance & Auto-refresh
    autoRefresh,
    lazyLoading,
    
    // Persistência
    hasPersistedData: persistence.hasValidData()
  };
}