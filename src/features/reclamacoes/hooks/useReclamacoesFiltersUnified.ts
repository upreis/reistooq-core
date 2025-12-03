/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS
 * FASE 2.2: Usando utilities compartilhadas de @/core/filters
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReclamacoesFiltersSync, ReclamacoesFilters } from './useReclamacoesFiltersSync';
import { usePersistentReclamacoesState } from './usePersistentReclamacoesState';
import {
  updateSingleFilter,
  updateMultipleFilters,
  resetSearchFilters as resetSearchFiltersUtil,
  hasActiveFilters as hasActiveFiltersUtil,
  countActiveFilters as countActiveFiltersUtil,
} from '@/core/filters';

const DEFAULT_FILTERS: ReclamacoesFilters = {
  periodo: '7', // 🔥 CORREÇÃO 1: Alterado de '60' para '7' (padrão: Últimos 7 dias)
  status: '',
  type: '',
  stage: '',
  selectedAccounts: [],
  currentPage: 1,
  itemsPerPage: 50
};

/**
 * Hook unificado para gestão de filtros com sincronização URL + cache
 */
export function useReclamacoesFiltersUnified() {
  const persistentCache = usePersistentReclamacoesState();
  const [searchParams] = useSearchParams();
  
  // Estado dos filtros - iniciar com defaults
  const [filters, setFilters] = useState<ReclamacoesFilters>(DEFAULT_FILTERS);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstRender = useRef(true); // 🔥 Rastrear primeira renderização
  const isRestoringFromUrl = useRef(false); // 🔥 ERRO 5: Flag para evitar loop de re-renderização

  // 🔥 ERRO 5 CORRIGIDO: Restaurar filtros com prioridade URL > Cache > Defaults
  // URL SEMPRE tem prioridade absoluta, mesmo quando cache falha
  useEffect(() => {
    if (!persistentCache.isStateLoaded) return;
    
    // 🔥 Marcar que estamos restaurando
    isRestoringFromUrl.current = true;
    
    // 1. Parsear filtros da URL PRIMEIRO
    const urlFilters: Partial<ReclamacoesFilters> = {};
    const hasUrlParams = searchParams.toString().length > 0;
    
    // 🔧 CORREÇÃO CRÍTICA: Verificar se cache tem período diferente do default
    const cachedPeriodo = persistentCache.persistedState?.filters?.periodo;
    const urlPeriodo = searchParams.get('periodo');
    
    // 🔧 CORREÇÃO: CACHE tem prioridade sobre URL quando:
    // - Cache existe com período diferente do default
    // - URL só tem o período default (não foi alterado pelo usuário)
    const cacheHasCustomPeriodo = cachedPeriodo && cachedPeriodo !== DEFAULT_FILTERS.periodo;
    const urlHasDefaultPeriodo = urlPeriodo === DEFAULT_FILTERS.periodo || !urlPeriodo;
    
    // Usar período da URL APENAS se:
    // - URL tem período NÃO-default (usuário explicitamente selecionou via URL compartilhada)
    // - OU cache não tem período customizado
    const shouldUseUrlPeriodo = urlPeriodo && !urlHasDefaultPeriodo;
    
    if (shouldUseUrlPeriodo) {
      urlFilters.periodo = urlPeriodo;
      console.log('🔗 [URL] Usando período da URL (não-default):', urlPeriodo);
    } else if (cacheHasCustomPeriodo) {
      // Cache tem período customizado e URL só tem default - NÃO capturar da URL
      console.log('📦 [CACHE] Ignorando período default da URL, cache tem:', cachedPeriodo);
    }
    
    const status = searchParams.get('status');
    if (status) urlFilters.status = status;
    
    const type = searchParams.get('type');
    if (type) urlFilters.type = type;
    
    const stage = searchParams.get('stage');
    if (stage) urlFilters.stage = stage;
    
    const accounts = searchParams.get('accounts');
    if (accounts) urlFilters.selectedAccounts = accounts.split(',').filter(Boolean);
    
    const page = searchParams.get('page');
    if (page) urlFilters.currentPage = parseInt(page, 10);
    
    const limit = searchParams.get('limit');
    if (limit) urlFilters.itemsPerPage = parseInt(limit, 10);
    
    // 2. Carregar filtros do cache APENAS se:
    //    - Não está inicializado ainda
    //    - Cache existe e é válido
    //    - Campo específico NÃO está na URL
    const cachedFilters: Partial<ReclamacoesFilters> = {};
    const cacheAvailable = !isInitialized && persistentCache.persistedState;
    
    if (cacheAvailable) {
      console.log('📦 [CACHE] Cache disponível, restaurando campos não presentes na URL');
      
      // 🔧 Período do cache (se não foi capturado da URL)
      if (!urlFilters.periodo && cachedPeriodo) {
        cachedFilters.periodo = cachedPeriodo;
        console.log('🔄 [CACHE] Restaurando período do cache:', cachedPeriodo);
      }
      if (!urlFilters.status && persistentCache.persistedState?.filters?.status) {
        cachedFilters.status = persistentCache.persistedState.filters.status;
      }
      if (!urlFilters.type && persistentCache.persistedState?.filters?.type) {
        cachedFilters.type = persistentCache.persistedState.filters.type;
      }
      if (!urlFilters.stage && persistentCache.persistedState?.filters?.stage) {
        cachedFilters.stage = persistentCache.persistedState.filters.stage;
      }
      if (!urlFilters.selectedAccounts && persistentCache.persistedState?.selectedAccounts?.length) {
        cachedFilters.selectedAccounts = persistentCache.persistedState.selectedAccounts;
      }
      if (!urlFilters.currentPage && persistentCache.persistedState?.currentPage) {
        cachedFilters.currentPage = persistentCache.persistedState.currentPage;
      }
      if (!urlFilters.itemsPerPage && persistentCache.persistedState?.itemsPerPage) {
        cachedFilters.itemsPerPage = persistentCache.persistedState.itemsPerPage;
      }
    } else if (!cacheAvailable && hasUrlParams) {
      // 🔥 ERRO 5: Cache falhou mas URL tem parâmetros - usar URL!
      console.log('⚠️ [ERRO 5] Cache indisponível, usando filtros da URL diretamente');
    }
    
    // Limpar cache antigo duplicado (uma única vez)
    const OLD_CACHE_KEY = 'RECLAMACOES_LOCAL_CACHE_V1';
    if (localStorage.getItem(OLD_CACHE_KEY)) {
      localStorage.removeItem(OLD_CACHE_KEY);
      console.log('🗑️ Cache antigo removido:', OLD_CACHE_KEY);
    }
    
    // 3. Merge: Defaults → Cache → URL (URL SEMPRE sobrescreve)
    const mergedFilters: ReclamacoesFilters = {
      ...DEFAULT_FILTERS,
      ...cachedFilters,
      ...urlFilters // 🔥 URL tem prioridade ABSOLUTA
    };
    
    console.log('🔄 [FILTROS] Restauração completa:', {
      hasUrlParams,
      cacheAvailable: !!cacheAvailable,
      urlFilters: Object.keys(urlFilters).length > 0 ? urlFilters : 'nenhum',
      cacheFilters: Object.keys(cachedFilters).length > 0 ? cachedFilters : 'nenhum',
      final: mergedFilters
    });
    
    setFilters(mergedFilters);
    setIsInitialized(true);

    // Resetar flag após restauração completar
    setTimeout(() => {
      isRestoringFromUrl.current = false;
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistentCache.isStateLoaded]); // 🔧 CORREÇÃO: Remover searchParams para evitar re-execuções

  // 🔥 CORREÇÃO 1: Cleanup separado - só roda no unmount real do componente
  useEffect(() => {
    return () => {
      setIsInitialized(false);
      console.log('🧹 [RECLAMACOES FILTERS] Limpando estado ao desmontar');
    };
  }, []); // Array vazio = só roda no mount/unmount

  // 🚀 COMBO 2.1: Sincronizar com URL APENAS após inicialização completa
  // 🔧 CORREÇÃO CRÍTICA: Passar isInitialized para bloquear sincronização até cache restaurar
  const { parseFiltersFromUrl, encodeFiltersToUrl } = useReclamacoesFiltersSync(
    filters,
    () => {}, // Não fazer nada quando URL mudar - restauração já foi feita acima
    isInitialized // 🔧 CORREÇÃO: Só sincronizar após cache ser restaurado
  );

  // 🔥 CORREÇÃO: Salvar filtros automaticamente no cache quando mudarem (com debounce)
  useEffect(() => {
    // 🔥 ERRO 4 CORRIGIDO: Ignorar salvamento durante inicialização
    if (!isInitialized || isFirstRender.current) {
      if (isInitialized && isFirstRender.current) {
        isFirstRender.current = false; // Marcar que inicialização terminou
      }
      return;
    }

    // 🔥 ERRO 5 CORRIGIDO: Não salvar se estamos restaurando da URL
    if (isRestoringFromUrl.current) {
      console.log('⏭️ [RECLAMACOES FILTERS] Ignorando salvamento durante restauração da URL');
      return;
    }
    
    const timer = setTimeout(() => {
      // Salvar apenas os filtros (não os dados de reclamações)
      persistentCache.saveState({
        filters: {
          periodo: filters.periodo,
          status: filters.status,
          type: filters.type,
          stage: filters.stage
        },
        selectedAccounts: filters.selectedAccounts,
        currentPage: filters.currentPage,
        itemsPerPage: filters.itemsPerPage,
        reclamacoes: persistentCache.persistedState?.reclamacoes || [], // Manter reclamações existentes
        cachedAt: Date.now(),
        version: 2
      });
      
      console.log('💾 Filtros salvos automaticamente:', {
        periodo: filters.periodo,
        status: filters.status,
        type: filters.type,
        stage: filters.stage,
        accounts: filters.selectedAccounts.length,
        page: filters.currentPage
      });
    }, 300); // Debounce de 300ms
    
    return () => clearTimeout(timer);
  }, [filters, isInitialized]); // 🔥 REMOVIDO persistentCache das dependências para evitar loop

  // 🔧 Helper para identificar keys de paginação
  const isPaginationKey = useCallback((key: keyof ReclamacoesFilters) => {
    return key === 'currentPage' || key === 'itemsPerPage';
  }, []);

  // Atualizar um filtro específico usando utility compartilhada
  const updateFilter = useCallback(<K extends keyof ReclamacoesFilters>(
    key: K,
    value: ReclamacoesFilters[K]
  ) => {
    setFilters(prev => 
      updateSingleFilter(prev, key, value, isPaginationKey)
    );
    console.log(`🎯 Filtro atualizado: ${key} =`, value);
  }, [isPaginationKey]);

  // Atualizar múltiplos filtros de uma vez usando utility compartilhada
  const updateFilters = useCallback((newFilters: Partial<ReclamacoesFilters>) => {
    setFilters(prev => 
      updateMultipleFilters(prev, newFilters, isPaginationKey)
    );
    console.log('🎯 Múltiplos filtros atualizados:', newFilters);
  }, [isPaginationKey]);

  // Resetar todos os filtros
  const resetFilters = useCallback(() => {
    console.log('🔄 Resetando todos os filtros');
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Resetar apenas filtros de busca usando utility compartilhada
  const resetSearchFilters = useCallback(() => {
    console.log('🔄 Resetando filtros de busca');
    const searchKeys: (keyof ReclamacoesFilters)[] = ['periodo', 'status', 'type', 'stage'];
    setFilters(prev => ({
      ...prev,
      ...resetSearchFiltersUtil(DEFAULT_FILTERS, searchKeys)
    }));
  }, []);

  // Verificar se há filtros ativos usando utility compartilhada
  const hasActiveFilters = useMemo(() => {
    const excludeKeys: (keyof ReclamacoesFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return hasActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  // Contar quantos filtros estão ativos usando utility compartilhada
  const activeFilterCount = useMemo(() => {
    const excludeKeys: (keyof ReclamacoesFilters)[] = ['selectedAccounts', 'currentPage', 'itemsPerPage'];
    return countActiveFiltersUtil(filters, DEFAULT_FILTERS, excludeKeys);
  }, [filters]);

  return {
    // Estado
    filters,
    
    // Ações
    updateFilter,
    updateFilters,
    resetFilters,
    resetSearchFilters,
    
    // Computados
    hasActiveFilters,
    activeFilterCount,
    
    // Helpers
    parseFiltersFromUrl,
    encodeFiltersToUrl,
    
    // Cache management
    persistentCache
  };
}
