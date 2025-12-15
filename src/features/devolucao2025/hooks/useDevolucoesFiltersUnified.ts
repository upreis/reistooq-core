/**
 * 🎯 HOOK UNIFICADO DE GESTÃO DE FILTROS - DEVOLUÇÕES
 * COMBO 2.1: Draft/Applied pattern com busca manual obrigatória
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  useDevolucoesFiltersSync, 
  DevolucoesFilters,
  DEFAULT_FILTERS 
} from './useDevolucoesFiltersSync';

const isDev = import.meta.env.DEV;
const STORAGE_KEY = 'devolucoes_filters_v3';

export interface UseDevolucoesFiltersUnifiedOptions {
  onFiltersApply?: (filters: DevolucoesFilters) => void;
  enableURLSync?: boolean;
}

/**
 * Serializa filtros para localStorage (converte Date para ISO string)
 */
function serializeFilters(filters: DevolucoesFilters): string {
  return JSON.stringify({
    ...filters,
    startDate: filters.startDate?.toISOString() || null,
    endDate: filters.endDate?.toISOString() || null,
  });
}

/**
 * Deserializa filtros do localStorage (converte ISO string para Date)
 */
function deserializeFilters(stored: string): DevolucoesFilters {
  const parsed = JSON.parse(stored);
  return {
    ...DEFAULT_FILTERS,
    ...parsed,
    startDate: parsed.startDate ? new Date(parsed.startDate) : DEFAULT_FILTERS.startDate,
    endDate: parsed.endDate ? new Date(parsed.endDate) : DEFAULT_FILTERS.endDate,
    selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
    searchTerm: parsed.searchTerm || '',
    currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
    itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : 50,
    activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
  };
}

export function useDevolucoesFiltersUnified(options: UseDevolucoesFiltersUnifiedOptions = {}) {
  const { 
    onFiltersApply, 
    enableURLSync = true 
  } = options;
  
  // Hook de sincronização URL + localStorage
  const filterSync = useDevolucoesFiltersSync({
    enabled: enableURLSync
  });

  // Estados principais - COMBO 2.1 pattern
  const [pendingFilters, setPendingFilters] = useState<DevolucoesFilters>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<DevolucoesFilters>({ ...DEFAULT_FILTERS });
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
        
        setPendingFilters(validatedFilters);
        setAppliedFilters(validatedFilters);
        
        if (isDev) console.log('📦 [DEVOLUCOES-FILTROS] Carregados do localStorage:', validatedFilters);
      } else if (enableURLSync && filterSync.hasActiveFilters) {
        // Se não tem localStorage mas tem URL, usar URL
        setPendingFilters(filterSync.filters);
        setAppliedFilters(filterSync.filters);
        
        if (isDev) console.log('📦 [DEVOLUCOES-FILTROS] Carregados da URL:', filterSync.filters);
      }
    } catch (error) {
      console.error('❌ [DEVOLUCOES-FILTROS] Erro ao carregar filtros:', error);
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
      if (isDev) console.log('⏭️ [DEVOLUCOES-FILTROS] Pulando salvamento - ainda inicializando');
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, serializeFilters(appliedFilters));
      if (isDev) console.log('💾 [DEVOLUCOES-FILTROS] Salvos no localStorage:', appliedFilters);
      
      // Sincronizar com URL também
      if (enableURLSync) {
        filterSync.writeFilters(appliedFilters);
      }
    } catch (error) {
      console.error('❌ [DEVOLUCOES-FILTROS] Erro ao salvar filtros:', error);
    }
  }, [appliedFilters, enableURLSync, filterSync]);

  /**
   * Atualizar filtro draft
   */
  const updateFilter = useCallback(<K extends keyof DevolucoesFilters>(
    key: K,
    value: DevolucoesFilters[K]
  ) => {
    if (isDev) console.log('🔧 [DEVOLUCOES-FILTROS] Atualizando filtro:', key, '=', value);
    
    setPendingFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  }, []);

  /**
   * Atualizar datas (para o SimplifiedPeriodFilter)
   */
  const updateDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    if (isDev) console.log('📅 [DEVOLUCOES-FILTROS] Atualizando datas:', { startDate, endDate });
    
    setPendingFilters(prev => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, []);

  /**
   * Aplicar filtros manualmente
   */
  const applyFilters = useCallback(() => {
    if (isDev) console.log('🔄 [DEVOLUCOES-FILTROS] Aplicando filtros:', pendingFilters);
    
    // Reset página para 1 ao aplicar novos filtros
    const filtersToApply: DevolucoesFilters = { 
      ...pendingFilters, 
      currentPage: 1 
    };
    
    setAppliedFilters(filtersToApply);
    setIsApplying(true);
    
    // Disparar callback para busca
    onFiltersApply?.(filtersToApply);
    
    // Finalizar estado após breve delay para UX
    setTimeout(() => {
      setIsApplying(false);
      if (isDev) console.log('✅ [DEVOLUCOES-FILTROS] Aplicação concluída');
    }, 500);
  }, [pendingFilters, onFiltersApply]);

  /**
   * Cancelar mudanças pendentes
   */
  const cancelChanges = useCallback(() => {
    setPendingFilters({ ...appliedFilters });
    if (isDev) console.log('↩️ [DEVOLUCOES-FILTROS] Mudanças canceladas');
  }, [appliedFilters]);

  /**
   * Limpar todos os filtros
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS };
    
    setPendingFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    
    localStorage.removeItem(STORAGE_KEY);
    
    if (enableURLSync) {
      filterSync.clearFilters();
    }
    
    onFiltersApply?.(clearedFilters);
    
    if (isDev) console.log('🗑️ [DEVOLUCOES-FILTROS] Todos filtros limpos');
  }, [enableURLSync, filterSync, onFiltersApply]);

  /**
   * Mudar página (aplicação imediata)
   */
  const changePage = useCallback((page: number) => {
    const newFilters = { ...appliedFilters, currentPage: page };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📄 [DEVOLUCOES-FILTROS] Página alterada:', page);
  }, [appliedFilters]);

  /**
   * Mudar itens por página (aplicação imediata, reset para página 1)
   */
  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    const newFilters = { ...appliedFilters, itemsPerPage, currentPage: 1 };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📊 [DEVOLUCOES-FILTROS] Itens por página alterado:', itemsPerPage);
  }, [appliedFilters]);

  /**
   * Mudar tab ativa (aplicação imediata, reset para página 1)
   */
  const changeTab = useCallback((tab: 'ativas' | 'historico') => {
    const newFilters = { ...appliedFilters, activeTab: tab, currentPage: 1 };
    setPendingFilters(newFilters);
    setAppliedFilters(newFilters);
    
    if (isDev) console.log('📑 [DEVOLUCOES-FILTROS] Tab alterada:', tab);
  }, [appliedFilters]);

  /**
   * Verificar se há mudanças pendentes
   */
  const hasPendingChanges = useMemo(() => {
    const pendingKeys = Object.keys(pendingFilters) as (keyof DevolucoesFilters)[];
    
    return pendingKeys.some(key => {
      // Ignorar página na comparação de mudanças pendentes
      if (key === 'currentPage') return false;
      
      const pendingValue = pendingFilters[key];
      const appliedValue = appliedFilters[key];
      
      if (Array.isArray(pendingValue) && Array.isArray(appliedValue)) {
        return JSON.stringify([...pendingValue].sort()) !== JSON.stringify([...appliedValue].sort());
      }
      
      // Comparar datas
      if (pendingValue instanceof Date && appliedValue instanceof Date) {
        return pendingValue.getTime() !== appliedValue.getTime();
      }
      
      // Se um é Date e outro não
      if (pendingValue instanceof Date || appliedValue instanceof Date) {
        return true;
      }
      
      return pendingValue !== appliedValue;
    });
  }, [pendingFilters, appliedFilters]);

  /**
   * Contar filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Contar datas se diferentes do default
    if (appliedFilters.startDate || appliedFilters.endDate) count++;
    if (appliedFilters.selectedAccounts.length > 0) count++;
    if (appliedFilters.searchTerm) count++;
    
    return count;
  }, [appliedFilters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    // Estados - COMBO 2.1 pattern
    filters: pendingFilters, // Para compatibilidade
    pendingFilters,
    appliedFilters,
    
    // Flags
    hasPendingChanges,
    hasActiveFilters,
    activeFiltersCount,
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
export type { DevolucoesFilters } from './useDevolucoesFiltersSync';
