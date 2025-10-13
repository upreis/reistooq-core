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

export function useDevolucoes(mlAccounts: any[], selectedAccountId?: string) {
  // Estados principais
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filtros avançados unificados com valores padrão completos
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>({
    // Busca
    searchTerm: '',
    // Contas
    contasSelecionadas: selectedAccountId ? [selectedAccountId] : [],
    // Datas - Buscar últimos 6 meses por padrão para incluir dados recentes
    dataInicio: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
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

    // 📅 FILTRO DE DATA INÍCIO (com validação)
    if (advancedFilters.dataInicio) {
      resultados = resultados.filter(dev => {
        if (!dev.data_criacao) return false;
        try {
          const dataCriacao = new Date(dev.data_criacao);
          const dataInicio = new Date(advancedFilters.dataInicio);
          dataInicio.setHours(0, 0, 0, 0);
          return dataCriacao >= dataInicio;
        } catch {
          return false;
        }
      });
    }

    // 📅 FILTRO DE DATA FIM (com validação e hora final do dia)
    if (advancedFilters.dataFim) {
      resultados = resultados.filter(dev => {
        if (!dev.data_criacao) return false;
        try {
          const dataCriacao = new Date(dev.data_criacao);
          const dataFim = new Date(advancedFilters.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          return dataCriacao <= dataFim;
        } catch {
          return false;
        }
      });
    }

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

  // Lazy loading para grandes datasets
  const lazyLoading = useLazyLoading({
    data: devolucoesFiltradas,
    chunkSize: performanceSettings.chunkSize,
    initialChunks: 2,
    enabled: performanceSettings.enableLazyLoading
  });

  // Atualizar contas selecionadas quando selectedAccountId mudar e buscar automaticamente
  useEffect(() => {
    if (selectedAccountId && advancedFilters.contasSelecionadas[0] !== selectedAccountId) {
      setAdvancedFilters(prev => ({
        ...prev,
        contasSelecionadas: [selectedAccountId]
      }));
      
      // Buscar automaticamente quando a conta mudar
      const buscarAutomaticamente = async () => {
        const dadosAPI = await busca.buscarDaAPI(
          { ...advancedFilters, contasSelecionadas: [selectedAccountId] },
          mlAccounts
        );
        setDevolucoes(dadosAPI);
        setCurrentPage(1);
        persistence.saveApiData(dadosAPI, { ...advancedFilters, contasSelecionadas: [selectedAccountId] });
      };
      
      buscarAutomaticamente();
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
      }
    }
    
    // Não buscar dados iniciais do banco automaticamente
  }, [persistence.isStateLoaded, mlAccounts]);


  // Buscar com filtros (SOMENTE da API quando acionada) E ENRIQUECER AUTOMATICAMENTE
  const buscarComFiltros = useCallback(async () => {
    flushDebounce(); // Aplicar busca imediatamente
    const dadosAPI = await busca.buscarDaAPI(advancedFilters, mlAccounts);
    setDevolucoes(dadosAPI);
    setCurrentPage(1);
    persistence.saveApiData(dadosAPI, advancedFilters);
    
    // ⚠️ NÃO ENRIQUECER AUTOMATICAMENTE - causava erro 400
    // Apenas exibir os dados buscados da API
    console.log(`[useDevolucoes] ✅ ${dadosAPI.length} devoluções buscadas com sucesso`);
  }, [flushDebounce, busca, advancedFilters, mlAccounts, persistence]);

  // Remover sincronização automática com banco
  // const sincronizarDevolucoes = ...

  // Busca automática inicial
  useEffect(() => {
    if (mlAccounts?.length > 0 && devolucoes.length === 0) {
      console.log('[useDevolucoes] 🚀 Carregando dados iniciais automaticamente...');
      buscarComFiltros();
    }
  }, [mlAccounts?.length]); // Só executa uma vez quando mlAccounts carrega

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
      // Busca
      searchTerm: '',
      // Contas
      contasSelecionadas: mlAccounts?.filter(acc => acc.is_active).map(acc => acc.id) || [],
      // Datas
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