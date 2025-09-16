/**
 * 🎯 HOOK PRINCIPAL DE DEVOLUÇÕES
 * Gerencia estado, filtros e persistência de forma otimizada
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
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
}

export function useDevolucoes(mlAccounts: any[]) {
  // Estados principais
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtros básicos
  const [filters, setFilters] = useState<DevolucaoFilters>({
    searchTerm: '',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  // Filtros avançados
  const [advancedFilters, setAdvancedFilters] = useState<DevolucaoAdvancedFilters>({
    contasSelecionadas: [],
    dataInicio: '',
    dataFim: '',
    statusClaim: '',
    buscarEmTempoReal: false
  });

  // Hooks
  const persistence = useDevolucoesPersistence();
  const busca = useDevolucoesBusca();
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

  // Inicialização: configurar contas ativas e carregar dados persistidos
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
        setFilters(state.filters || filters);
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
      persistence.saveDatabaseData(dadosBanco, filters);
    }
  }, [busca, persistence, filters]);

  // Filtrar dados localmente
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

    if (filters.status) {
      resultados = resultados.filter(dev => dev.status_devolucao === filters.status);
    }

    if (filters.dataInicio) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) >= new Date(filters.dataInicio)
      );
    }

    if (filters.dataFim) {
      resultados = resultados.filter(dev => 
        new Date(dev.data_criacao) <= new Date(filters.dataFim)
      );
    }

    return resultados;
  }, [devolucoes, debouncedSearchTerm, filters]);

  // Buscar com filtros
  const buscarComFiltros = useCallback(async () => {
    if (advancedFilters.buscarEmTempoReal) {
      // Buscar da API ML
      const dadosAPI = await busca.buscarDaAPI(advancedFilters, mlAccounts);
      setDevolucoes(dadosAPI);
      setCurrentPage(1);
      
      persistence.saveApiData(dadosAPI, advancedFilters);
      
      // Limpar filtros locais para mostrar todos os dados da API
      setFilters({
        searchTerm: '',
        status: '',
        dataInicio: '',
        dataFim: ''
      });
    } else {
      // Buscar do banco
      const dadosBanco = await busca.buscarDoBanco();
      setDevolucoes(dadosBanco);
      persistence.saveDatabaseData(dadosBanco, filters);
    }
  }, [advancedFilters, busca, mlAccounts, persistence, filters]);

  // Sincronizar devoluções
  const sincronizarDevolucoes = useCallback(async () => {
    const dadosAtualizados = await busca.sincronizarDevolucoes(mlAccounts);
    if (dadosAtualizados.length > 0) {
      setDevolucoes(dadosAtualizados);
      persistence.saveDatabaseData(dadosAtualizados, filters);
    }
  }, [busca, mlAccounts, persistence, filters]);

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<DevolucaoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateAdvancedFilters = useCallback((newFilters: Partial<DevolucaoAdvancedFilters>) => {
    setAdvancedFilters(prev => ({ ...prev, ...newFilters }));
    
    // Salvar contas selecionadas
    if (newFilters.contasSelecionadas) {
      persistence.saveSelectedAccounts(newFilters.contasSelecionadas);
    }
  }, [persistence]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: '',
      dataInicio: '',
      dataFim: ''
    });
    persistence.clearPersistedState();
  }, [persistence]);

  // Paginação
  const itemsPerPage = 20;
  const totalPages = Math.ceil(devolucoesFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const devolucoesPaginadas = devolucoesFiltradas.slice(startIndex, startIndex + itemsPerPage);

  // Estatísticas
  const stats = useMemo(() => ({
    total: devolucoesFiltradas.length,
    pendentes: devolucoesFiltradas.filter(d => d.status_devolucao === 'with_claims').length,
    concluidas: devolucoesFiltradas.filter(d => d.status_devolucao === 'completed').length,
    canceladas: devolucoesFiltradas.filter(d => d.status_devolucao === 'cancelled').length
  }), [devolucoesFiltradas]);

  return {
    // Dados
    devolucoes: devolucoesPaginadas,
    devolucoesFiltradas,
    stats,
    
    // Estados
    loading: busca.loading,
    currentPage,
    totalPages,
    
    // Filtros
    filters,
    advancedFilters,
    updateFilters,
    updateAdvancedFilters,
    clearFilters,
    
    // Ações
    buscarComFiltros,
    sincronizarDevolucoes,
    setCurrentPage,
    
    // Persistência
    hasPersistedData: persistence.hasValidData()
  };
}