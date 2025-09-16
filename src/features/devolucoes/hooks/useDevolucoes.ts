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

export function useDevolucoes(mlAccounts: any[]) {
  // Estados principais
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filtros avançados unificados
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>({
    contasSelecionadas: [],
    dataInicio: '',
    dataFim: '',
    statusClaim: '',
    searchTerm: '', // Campo de busca unificado
    buscarEmTempoReal: false,
    autoRefreshEnabled: false,
    autoRefreshInterval: 30 // 30 segundos por padrão
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

  // Busca principal com debounce
  const executarBusca = useCallback(async () => {
    if (advancedFilters.buscarEmTempoReal) {
      const dadosAPI = await busca.buscarDaAPI(advancedFilters, mlAccounts);
      setDevolucoes(dadosAPI);
      setCurrentPage(1);
      persistence.saveApiData(dadosAPI, advancedFilters);
    } else {
      const dadosBanco = await busca.buscarDoBanco();
      setDevolucoes(dadosBanco);
      persistence.saveDatabaseData(dadosBanco, advancedFilters);
    }
  }, [advancedFilters, busca, mlAccounts, persistence]);

  // Auto-refresh configurável
  const autoRefresh = useAutoRefresh({
    enabled: advancedFilters.autoRefreshEnabled && advancedFilters.buscarEmTempoReal,
    interval: advancedFilters.autoRefreshInterval,
    onRefresh: executarBusca,
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

  // Inicialização otimizada
  useEffect(() => {
    if (!persistence.isStateLoaded || !mlAccounts?.length) return;

    // Configurar contas ativas automaticamente
    const contasAtivas = mlAccounts.filter(acc => acc.is_active);
    if (contasAtivas.length > 0 && advancedFilters.contasSelecionadas.length === 0) {
      setAdvancedFilters(prev => ({
        ...prev,
        contasSelecionadas: contasAtivas.map(acc => acc.id)
      }));
    }

    // Restaurar dados se existirem
    if (persistence.hasValidData()) {
      const state = persistence.persistedState!;
      setDevolucoes(state.data);
      setCurrentPage(state.currentPage);
      
      if (state.dataSource === 'api') {
        setAdvancedFilters(prev => ({
          ...prev,
          ...state.searchFilters,
          buscarEmTempoReal: true
        }));
      } else {
        setAdvancedFilters(prev => ({ ...prev, ...state.filters }));
      }
      
      console.log(`🔄 ${state.data.length} devoluções restauradas (${state.dataSource})`);
    } else if (contasAtivas.length > 0) {
      // Carregar dados inicial do banco
      carregarDadosIniciais();
    }
  }, [persistence.isStateLoaded, mlAccounts]);

  // Carregar dados iniciais do banco
  const carregarDadosIniciais = useCallback(async () => {
    const dadosBanco = await busca.buscarDoBanco();
    if (dadosBanco.length > 0) {
      setDevolucoes(dadosBanco);
      persistence.saveDatabaseData(dadosBanco, advancedFilters);
    }
  }, [busca, persistence, advancedFilters]);

  // Buscar com filtros (flush debounce para busca imediata)
  const buscarComFiltros = useCallback(async () => {
    flushDebounce(); // Aplicar busca imediatamente
    await executarBusca();
  }, [executarBusca, flushDebounce]);

  // Sincronizar devoluções
  const sincronizarDevolucoes = useCallback(async () => {
    const dadosAtualizados = await busca.sincronizarDevolucoes(mlAccounts);
    if (dadosAtualizados.length > 0) {
      setDevolucoes(dadosAtualizados);
      persistence.saveDatabaseData(dadosAtualizados, advancedFilters);
    }
  }, [busca, mlAccounts, persistence, advancedFilters]);

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
      buscarEmTempoReal: false,
      autoRefreshEnabled: false,
      autoRefreshInterval: 30
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
    
    // Ações
    buscarComFiltros,
    sincronizarDevolucoes,
    setCurrentPage,
    toggleAnalytics,
    
    // Performance & Auto-refresh
    autoRefresh,
    lazyLoading,
    
    // Persistência
    hasPersistedData: persistence.hasValidData()
  };
}