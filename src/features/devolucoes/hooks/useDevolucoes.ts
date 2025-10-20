/**
 * 🎯 HOOK PRINCIPAL OTIMIZADO DE DEVOLUÇÕES
 * Versão com performance melhorada e controles avançados
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDevolucoesBusca, DevolucaoBuscaFilters } from './useDevolucoesBusca';

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
  const STORAGE_KEY_FILTERS = 'ml_devolucoes_last_filters';
  
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>(() => {
    // Tentar carregar filtros salvos
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📂 Filtros carregados do localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    }

    // 🚀 GARANTIR SEMPRE ARRAY VÁLIDO
    const initialAccounts = Array.isArray(selectedAccountIds) && selectedAccountIds.length > 0 
      ? selectedAccountIds 
      : selectedAccountId 
        ? [selectedAccountId] 
        : [];
    
    return {
      // Busca
      searchTerm: '',
      // Contas - SEMPRE UM ARRAY
      contasSelecionadas: initialAccounts,
      // 📅 DATAS VAZIAS - Sem valores padrão, usuário deve escolher o período
      dataInicio: '',
      dataFim: '',
      // Status e Classificação
      statusClaim: '',
      tipoClaim: '',
      subtipoClaim: '',
      motivoCategoria: '',
      // Financeiro
      valorRetidoMin: '',
      valorRetidoMax: '',
      tipoReembolso: '',
      responsavelCusto: '',
      // Rastreamento
      temRastreamento: '',
      statusRastreamento: '',
      transportadora: '',
      // Anexos e Comunicação
      temAnexos: '',
      mensagensNaoLidasMin: '',
      // Prioridade e Ação
      nivelPrioridade: '',
      acaoSellerNecessaria: '',
      escaladoParaML: '',
      emMediacao: '',
      // Prazos
      prazoVencido: '',
      slaNaoCumprido: '',
      // Métricas
      eficienciaResolucao: '',
      scoreQualidadeMin: '',
      // Controle
      buscarEmTempoReal: true,
      autoRefreshEnabled: false,
      autoRefreshInterval: 3600
    };
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
  
  // Estados de carregamento (após outros hooks)
  const [loading, setLoading] = useState(false);
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

  // Filtrar dados localmente com debounce E TODOS OS NOVOS FILTROS
  const devolucoesFiltradas = useMemo(() => {
    let resultados = [...devolucoes];

    // 🔍 BUSCA TEXTUAL EXPANDIDA
    if (debouncedSearchTerm) {
      const searchTerm = debouncedSearchTerm.toLowerCase();
      resultados = resultados.filter(dev => 
        dev.produto_titulo?.toLowerCase().includes(searchTerm) ||
        dev.order_id?.toString().includes(searchTerm) ||
        dev.claim_id?.toString().includes(searchTerm) ||
        dev.sku?.toLowerCase().includes(searchTerm) ||
        dev.comprador_nickname?.toLowerCase().includes(searchTerm) ||
        dev.codigo_rastreamento?.toLowerCase().includes(searchTerm) ||
        dev.transportadora?.toLowerCase().includes(searchTerm)
      );
    }

    // 🎯 FILTRO DE STATUS CORRIGIDO
    if (advancedFilters.statusClaim) {
      if (advancedFilters.statusClaim === 'with_claims') {
        resultados = resultados.filter(dev => 
          dev.claim_id !== null && 
          dev.claim_id !== undefined && 
          dev.claim_id !== ''
        );
      } else {
        resultados = resultados.filter(dev => dev.status_devolucao === advancedFilters.statusClaim);
      }
    }

    // 🎯 FILTRO DE TIPO DE CLAIM
    if (advancedFilters.tipoClaim) {
      resultados = resultados.filter(dev => dev.tipo_claim === advancedFilters.tipoClaim);
    }

    // ⚠️ FILTROS DE DATA REMOVIDOS - A API JÁ FILTRA POR DATA
    // Os filtros dataInicio e dataFim são enviados para a API e ela retorna apenas dados dentro do período
    // Não devemos filtrar novamente aqui, pois isso remove dados válidos

    // 💰 FILTRO DE VALOR MÍNIMO
    if (advancedFilters.valorRetidoMin) {
      const minValue = parseFloat(advancedFilters.valorRetidoMin);
      if (!isNaN(minValue)) {
        resultados = resultados.filter(dev => (dev.valor_retido || 0) >= minValue);
      }
    }

    // 💰 FILTRO DE VALOR MÁXIMO
    if (advancedFilters.valorRetidoMax) {
      const maxValue = parseFloat(advancedFilters.valorRetidoMax);
      if (!isNaN(maxValue)) {
        resultados = resultados.filter(dev => (dev.valor_retido || 0) <= maxValue);
      }
    }

    // 💰 FILTRO DE RESPONSÁVEL PELO CUSTO
    if (advancedFilters.responsavelCusto) {
      resultados = resultados.filter(dev => dev.responsavel_custo === advancedFilters.responsavelCusto);
    }

    // 🚚 FILTRO DE RASTREAMENTO
    if (advancedFilters.temRastreamento) {
      const temRastreio = advancedFilters.temRastreamento === 'sim';
      resultados = resultados.filter(dev => 
        temRastreio ? (dev.codigo_rastreamento !== null && dev.codigo_rastreamento !== '') : !dev.codigo_rastreamento
      );
    }

    // 🚚 FILTRO DE STATUS DE RASTREAMENTO
    if (advancedFilters.statusRastreamento) {
      resultados = resultados.filter(dev => dev.status_rastreamento === advancedFilters.statusRastreamento);
    }

    // 📎 FILTRO DE ANEXOS
    if (advancedFilters.temAnexos) {
      const temAnexos = advancedFilters.temAnexos === 'sim';
      resultados = resultados.filter(dev => 
        temAnexos ? (dev.anexos_count || 0) > 0 : (dev.anexos_count || 0) === 0
      );
    }

    // 📎 FILTRO DE MENSAGENS NÃO LIDAS
    if (advancedFilters.mensagensNaoLidasMin) {
      const minMensagens = parseInt(advancedFilters.mensagensNaoLidasMin);
      if (!isNaN(minMensagens)) {
        resultados = resultados.filter(dev => (dev.mensagens_nao_lidas || 0) >= minMensagens);
      }
    }

    // ⚠️ FILTRO DE NÍVEL DE PRIORIDADE
    if (advancedFilters.nivelPrioridade) {
      resultados = resultados.filter(dev => dev.nivel_prioridade === advancedFilters.nivelPrioridade);
    }

    // ⚠️ FILTRO DE AÇÃO SELLER NECESSÁRIA
    if (advancedFilters.acaoSellerNecessaria) {
      const acaoNecessaria = advancedFilters.acaoSellerNecessaria === 'sim';
      resultados = resultados.filter(dev => dev.acao_seller_necessaria === acaoNecessaria);
    }

    // ⚠️ FILTRO DE EM MEDIAÇÃO
    if (advancedFilters.emMediacao) {
      const emMediacao = advancedFilters.emMediacao === 'sim';
      resultados = resultados.filter(dev => dev.em_mediacao === emMediacao);
    }

    // ⚠️ FILTRO DE ESCALADO PARA ML
    if (advancedFilters.escaladoParaML) {
      const escalado = advancedFilters.escaladoParaML === 'sim';
      resultados = resultados.filter(dev => dev.escalado_para_ml === escalado);
    }

    // ⏰ FILTRO DE PRAZO VENCIDO
    if (advancedFilters.prazoVencido) {
      const vencido = advancedFilters.prazoVencido === 'sim';
      resultados = resultados.filter(dev => {
        if (!dev.data_vencimento_acao) return !vencido;
        return vencido ? new Date(dev.data_vencimento_acao) < new Date() : new Date(dev.data_vencimento_acao) >= new Date();
      });
    }

    // ⏰ FILTRO DE SLA NÃO CUMPRIDO
    if (advancedFilters.slaNaoCumprido) {
      const naoCumprido = advancedFilters.slaNaoCumprido === 'sim';
      resultados = resultados.filter(dev => dev.sla_cumprido === !naoCumprido);
    }

    // 📈 FILTRO DE EFICIÊNCIA DE RESOLUÇÃO
    if (advancedFilters.eficienciaResolucao) {
      resultados = resultados.filter(dev => dev.eficiencia_resolucao === advancedFilters.eficienciaResolucao);
    }

    // 📈 FILTRO DE SCORE MÍNIMO
    if (advancedFilters.scoreQualidadeMin) {
      const minScore = parseInt(advancedFilters.scoreQualidadeMin);
      if (!isNaN(minScore)) {
        resultados = resultados.filter(dev => (dev.score_qualidade || 0) >= minScore);
      }
    }

    // 📅 ORDENAR POR DATA DE CRIAÇÃO (MAIS RECENTE PRIMEIRO)
    resultados.sort((a, b) => {
      const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
      const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
      return dataB - dataA; // Ordem decrescente (mais recente primeiro)
    });

    return resultados;
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
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
      try {
        localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filtrosParaAplicar));
        console.log('💾 Filtros salvos no localStorage:', filtrosParaAplicar);
      } catch (error) {
        console.error('Erro ao salvar filtros:', error);
      }
      
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
    const filtrosLimpos = {
      searchTerm: '',
      contasSelecionadas: mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [],
      dataInicio: '',
      dataFim: '',
      statusClaim: '',
      tipoClaim: '',
      subtipoClaim: '',
      motivoCategoria: '',
      valorRetidoMin: '',
      valorRetidoMax: '',
      tipoReembolso: '',
      responsavelCusto: '',
      temRastreamento: '',
      statusRastreamento: '',
      transportadora: '',
      temAnexos: '',
      mensagensNaoLidasMin: '',
      nivelPrioridade: '',
      acaoSellerNecessaria: '',
      escaladoParaML: '',
      emMediacao: '',
      prazoVencido: '',
      slaNaoCumprido: '',
      eficienciaResolucao: '',
      scoreQualidadeMin: '',
      buscarEmTempoReal: true,
      autoRefreshEnabled: false,
      autoRefreshInterval: 3600
    };
    
    setAdvancedFilters(filtrosLimpos);
    setDraftFilters(null);
    setDevolucoes([]);
    setCurrentPage(1);
    
    // Limpar do localStorage
    try {
      localStorage.removeItem(STORAGE_KEY_FILTERS);
      console.log('🗑️ Filtros removidos do localStorage');
    } catch (error) {
      console.error('Erro ao limpar filtros salvos:', error);
    }
    
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
    loading: busca.loading || loading,
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