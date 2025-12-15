/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - PADRÃO COMBO 2.1
 * Usa startDate/endDate (Date objects) ao invés de periodo (string)
 * Sincroniza com URL + localStorage
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useReclamacoesFiltersSync, ReclamacoesFilters, DEFAULT_FILTERS } from './useReclamacoesFiltersSync';

const isDev = import.meta.env.DEV;
const STORAGE_KEY = 'reclamacoes_filters_v3';

interface UseReclamacoesFiltersUnifiedOptions {
  onFiltersApply?: (filters: ReclamacoesFilters) => void;
  enableURLSync?: boolean;
}

/**
 * Serializa filtros para localStorage (converte Date para ISO string)
 */
function serializeFilters(filters: ReclamacoesFilters): string {
  return JSON.stringify({
    ...filters,
    startDate: filters.startDate?.toISOString() || null,
    endDate: filters.endDate?.toISOString() || null,
  });
}

/**
 * Deserializa filtros do localStorage (converte ISO string para Date)
 */
function deserializeFilters(stored: string): ReclamacoesFilters {
  const parsed = JSON.parse(stored);
  return {
    ...DEFAULT_FILTERS,
    ...parsed,
    startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_FILTERS.startDate,
    endDate: parsed.endDate ? new Date(parsed.endDate) : DEFAULT_FILTERS.endDate,
    selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
    status: parsed.status || '',
    type: parsed.type || '',
    stage: parsed.stage || '',
    currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
    itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : 50,
    activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
  };
}

export function useReclamacoesFiltersUnified(options: UseReclamacoesFiltersUnifiedOptions = {}) {
  const { 
    onFiltersApply, 
    enableURLSync = true 
  } = options;
  
  // Hook de sincronização URL + localStorage
  const filterSync = useReclamacoesFiltersSync({
    enabled: enableURLSync
  });

  // Estados principais
  const [draftFilters, setDraftFilters] = useState<ReclamacoesFilters>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<ReclamacoesFilters>({ ...DEFAULT_FILTERS });
  const [isApplying, setIsApplying] = useState(false);
  
  // Flags de controle
  const isInitializingRef = useRef(true);
  const hasInitializedRef = useRef(false);
  
  /**
   * INICIALIZAÇÃO - Carregar do localStorage/URL na montagem
   */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    // Carregar do localStorage primeiro
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const validatedFilters = deserializeFilters(stored);
        
        setDraftFilters(validatedFilters);
        setAppliedFilters(validatedFilters);
        
        if (isDev) console.log('📦 [RECLAMACOES-FILTROS] Carregados do localStorage:', validatedFilters);
      } else if (enableURLSync && filterSync.hasActiveFilters) {
        // Se não tem localStorage mas tem URL, usar URL
        setDraftFilters(filterSync.filters);
        setAppliedFilters(filterSync.filters);
        
        if (isDev) console.log('📦 [RECLAMACOES-FILTROS] Carregados da URL:', filterSync.filters);
      }
    } catch (error) {
      console.error('❌ [RECLAMACOES-FILTROS] Erro ao carregar filtros:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    
    // Marcar como não inicializando após carregar
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
  }, [enableURLSync, filterSync.filters, filterSync.hasActiveFilters]);

  /**
   * SALVAR AUTOMATICAMENTE no localStorage quando appliedFilters mudar
   */
  useEffect(() => {
    if (isInitializingRef.current) {
      if (isDev) console.log('⏭️ [RECLAMACOES-FILTROS] Pulando salvamento - ainda inicializando');
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, serializeFilters(appliedFilters));
      if (isDev) console.log('💾 [RECLAMACOES-FILTROS] Salvos no localStorage:', appliedFilters);
      
      // Sincronizar com URL também
      if (enableURLSync) {
        filterSync.writeFilters(appliedFilters);
      }
    } catch (error) {
      console.error('❌ [RECLAMACOES-FILTROS] Erro ao salvar filtros:', error);
    }
  }, [appliedFilters, enableURLSync, filterSync]);

  /**
   * Atualizar filtro draft
   */
  const updateFilter = useCallback(<K extends keyof ReclamacoesFilters>(
    key: K,
    value: ReclamacoesFilters[K]
  ) => {
    if (isDev) console.log('🔧 [RECLAMACOES-FILTROS] Atualizando filtro:', key, '=', value);
    
    setDraftFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  }, []);

  /**
   * Atualizar datas (para o SimplifiedPeriodFilter)
   */
  const updateDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    if (isDev) console.log('📅 [RECLAMACOES-FILTROS] Atualizando datas:', { startDate, endDate });
    
    setDraftFilters(prev => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, []);

  /**
   * Aplicar filtros manualmente
   */
  const applyFilters = useCallback(() => {
    if (isDev) console.log('🔄 [RECLAMACOES-FILTROS] Aplicando filtros:', draftFilters);
    
    // Reset página para 1 ao aplicar novos filtros
    const filtersToApply: ReclamacoesFilters = { 
      ...draftFilters, 
      currentPage: 1 
    };
    
    setAppliedFilters(filtersToApply);
    setIsApplying(true);
    
    // Disparar callback para busca
    onFiltersApply?.(filtersToApply);
    
    // Finalizar estado após breve delay para UX
    setTimeout(() => {
      setIsApplying(false);
      if (isDev) console.log('✅ [RECLAMACOES-FILTROS] Aplicação concluída');
    }, 500);
  }, [draftFilters, onFiltersApply]);

  /**
   * Cancelar mudanças pendentes
   */
  const cancelChanges = useCallback(() => {
    setDraftFilters({ ...appliedFilters });
    if (isDev) console.log('↩️ [RECLAMACOES-FILTROS] Mudanças canceladas');
  }, [appliedFilters]);

  /**
   * Limpar todos os filtros
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS };
    
    setDraftFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    
    localStorage.removeItem(STORAGE_KEY);
    
    if (enableURLSync) {
      filterSync.clearFilters();
    }
    
    onFiltersApply?.(clearedFilters);
    
    if (isDev) console.log('🗑️ [RECLAMACOES-FILTROS] Todos filtros limpos');
  }, [enableURLSync, filterSync, onFiltersApply]);

  /**
   * Mudar página (aplicação imediata)
   */
  const changePage = useCallback((page: number) => {
    const newFilters = { ...appliedFilters, currentPage: page };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📄 [RECLAMACOES-FILTROS] Página alterada:', page);
  }, [appliedFilters]);

  /**
   * Mudar itens por página (aplicação imediata, reset para página 1)
   */
  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    const newFilters = { ...appliedFilters, itemsPerPage, currentPage: 1 };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📊 [RECLAMACOES-FILTROS] Itens por página alterado:', itemsPerPage);
  }, [appliedFilters]);

  /**
   * Mudar tab ativa (aplicação imediata, reset para página 1)
   */
  const changeTab = useCallback((tab: 'ativas' | 'historico') => {
    const newFilters = { ...appliedFilters, activeTab: tab, currentPage: 1 };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📑 [RECLAMACOES-FILTROS] Tab alterada:', tab);
  }, [appliedFilters]);

  /**
   * Verificar se há mudanças pendentes
   */
  const hasPendingChanges = useMemo(() => {
    const draftKeys = Object.keys(draftFilters) as (keyof ReclamacoesFilters)[];
    
    return draftKeys.some(key => {
      // Ignorar página na comparação de mudanças pendentes
      if (key === 'currentPage') return false;
      
      const draftValue = draftFilters[key];
      const appliedValue = appliedFilters[key];
      
      if (Array.isArray(draftValue) && Array.isArray(appliedValue)) {
        return JSON.stringify([...draftValue].sort()) !== JSON.stringify([...appliedValue].sort());
      }
      
      // Comparar datas
      if (draftValue instanceof Date && appliedValue instanceof Date) {
        return draftValue.getTime() !== appliedValue.getTime();
      }
      
      // Se um é Date e outro não
      if (draftValue instanceof Date || appliedValue instanceof Date) {
        return true;
      }
      
      return draftValue !== appliedValue;
    });
  }, [draftFilters, appliedFilters]);

  /**
   * Contar filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Contar datas se diferentes do default
    if (appliedFilters.startDate || appliedFilters.endDate) count++;
    if (appliedFilters.selectedAccounts.length > 0) count++;
    if (appliedFilters.status) count++;
    if (appliedFilters.type) count++;
    if (appliedFilters.stage) count++;
    
    return count;
  }, [appliedFilters]);

  const hasActiveFilters = activeFiltersCount > 0;
  const needsManualApplication = hasPendingChanges;

  /**
   * Converter para parâmetros da API (com datas formatadas)
   */
  const apiParams = useMemo(() => {
    return {
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate,
      selectedAccounts: appliedFilters.selectedAccounts,
      status: appliedFilters.status,
      type: appliedFilters.type,
      stage: appliedFilters.stage,
      currentPage: appliedFilters.currentPage,
      itemsPerPage: appliedFilters.itemsPerPage,
      activeTab: appliedFilters.activeTab,
    };
  }, [appliedFilters]);

  return {
    // Estados
    filters: draftFilters,
    appliedFilters,
    apiParams,
    
    // Flags
    hasPendingChanges,
    hasActiveFilters,
    activeFiltersCount,
    needsManualApplication,
    isApplying,
    
    // Ações de filtros
    updateFilter,
    updateDateRange,
    applyFilters,
    cancelChanges,
    clearFilters,
    
    // Ações de navegação (aplicação imediata)
    changePage,
    changeItemsPerPage,
    changeTab,
    
    // Defaults para referência
    defaultFilters: DEFAULT_FILTERS,
    
    // Helpers
    parseFiltersFromUrl: filterSync.parseFiltersFromUrl,
    encodeFiltersToUrl: filterSync.encodeFiltersToUrl,
  };
}

// Re-export types
export type { ReclamacoesFilters } from './useReclamacoesFiltersSync';
