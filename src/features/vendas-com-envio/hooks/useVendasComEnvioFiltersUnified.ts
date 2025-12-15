/**
 * 🚀 VENDAS COM ENVIO - Hook Unificado de Filtros
 * Baseado no padrão de /pedidos (usePedidosFiltersUnified)
 * 
 * Características:
 * - Estado draft (pendente) vs applied (aplicado)
 * - Aplicação manual de filtros
 * - Persistência híbrida: URL + localStorage
 * - Flags: hasPendingChanges, hasActiveFilters, needsManualApplication
 * - Callback onFiltersApply para disparo de busca
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { VendasComEnvioFilters, ShippingStatus } from '../types';
import { DEFAULT_PERIODO, DEFAULT_ITEMS_PER_PAGE } from '../config';
import { useVendasComEnvioFiltersSync } from './useVendasComEnvioFiltersSync';

const isDev = process.env.NODE_ENV === 'development';
const STORAGE_KEY = 'vendas_com_envio_unified_filters';

/**
 * Filtros padrão
 */
export const DEFAULT_FILTERS: VendasComEnvioFilters = {
  periodo: DEFAULT_PERIODO,
  selectedAccounts: [],
  shippingStatus: 'all',
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
  activeTab: 'ativas',
};

interface UseVendasComEnvioFiltersUnifiedOptions {
  onFiltersApply?: (filters: VendasComEnvioFilters) => void;
  enableURLSync?: boolean;
}

export function useVendasComEnvioFiltersUnified(options: UseVendasComEnvioFiltersUnifiedOptions = {}) {
  const { 
    onFiltersApply, 
    enableURLSync = true 
  } = options;
  
  // Hook de sincronização URL + localStorage
  const filterSync = useVendasComEnvioFiltersSync({
    enabled: enableURLSync
  });

  // Estados principais
  const [draftFilters, setDraftFilters] = useState<VendasComEnvioFilters>({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState<VendasComEnvioFilters>({ ...DEFAULT_FILTERS });
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
        const parsed = JSON.parse(stored);
        
        // Validar e mesclar com defaults
        const validatedFilters: VendasComEnvioFilters = {
          ...DEFAULT_FILTERS,
          periodo: typeof parsed.periodo === 'number' ? parsed.periodo : DEFAULT_PERIODO,
          selectedAccounts: Array.isArray(parsed.selectedAccounts) ? parsed.selectedAccounts : [],
          shippingStatus: parsed.shippingStatus || 'all',
          searchTerm: parsed.searchTerm || '',
          currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
          itemsPerPage: typeof parsed.itemsPerPage === 'number' ? parsed.itemsPerPage : DEFAULT_ITEMS_PER_PAGE,
          activeTab: parsed.activeTab === 'historico' ? 'historico' : 'ativas',
        };
        
        setDraftFilters(validatedFilters);
        setAppliedFilters(validatedFilters);
        
        if (isDev) console.log('📦 [VENDAS-ENVIO-FILTROS] Carregados do localStorage:', validatedFilters);
      } else if (enableURLSync && filterSync.hasActiveFilters) {
        // Se não tem localStorage mas tem URL, usar URL
        setDraftFilters(filterSync.filters);
        setAppliedFilters(filterSync.filters);
        
        if (isDev) console.log('📦 [VENDAS-ENVIO-FILTROS] Carregados da URL:', filterSync.filters);
      }
    } catch (error) {
      console.error('❌ [VENDAS-ENVIO-FILTROS] Erro ao carregar filtros:', error);
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
      if (isDev) console.log('⏭️ [VENDAS-ENVIO-FILTROS] Pulando salvamento - ainda inicializando');
      return;
    }
    
    // Verificar se há filtros diferentes dos defaults
    const hasFilters = Object.keys(appliedFilters).some(key => {
      const val = appliedFilters[key as keyof VendasComEnvioFilters];
      const def = DEFAULT_FILTERS[key as keyof VendasComEnvioFilters];
      if (Array.isArray(val)) return val.length > 0;
      return val !== def;
    });
    
    if (!hasFilters) {
      localStorage.removeItem(STORAGE_KEY);
      if (isDev) console.log('🗑️ [VENDAS-ENVIO-FILTROS] localStorage limpo (sem filtros)');
      return;
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appliedFilters));
      if (isDev) console.log('💾 [VENDAS-ENVIO-FILTROS] Salvos no localStorage:', appliedFilters);
      
      // Sincronizar com URL também
      if (enableURLSync) {
        filterSync.writeFilters(appliedFilters);
      }
    } catch (error) {
      console.error('❌ [VENDAS-ENVIO-FILTROS] Erro ao salvar filtros:', error);
    }
  }, [appliedFilters, enableURLSync, filterSync]);

  /**
   * Atualizar filtro draft
   */
  const updateDraftFilter = useCallback(<K extends keyof VendasComEnvioFilters>(
    key: K,
    value: VendasComEnvioFilters[K]
  ) => {
    if (isDev) console.log('🔧 [VENDAS-ENVIO-FILTROS] Atualizando filtro:', key, '=', value);
    
    setDraftFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  }, []);

  /**
   * Aplicar filtros manualmente
   */
  const applyFilters = useCallback(() => {
    if (isDev) console.log('🔄 [VENDAS-ENVIO-FILTROS] Aplicando filtros:', draftFilters);
    
    // Reset página para 1 ao aplicar novos filtros
    const filtersToApply: VendasComEnvioFilters = { 
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
      if (isDev) console.log('✅ [VENDAS-ENVIO-FILTROS] Aplicação concluída:', filtersToApply);
    }, 500);
  }, [draftFilters, onFiltersApply]);

  /**
   * Cancelar mudanças pendentes
   */
  const cancelChanges = useCallback(() => {
    setDraftFilters({ ...appliedFilters });
    if (isDev) console.log('↩️ [VENDAS-ENVIO-FILTROS] Mudanças canceladas');
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
    
    if (isDev) console.log('🗑️ [VENDAS-ENVIO-FILTROS] Todos filtros limpos');
  }, [enableURLSync, filterSync, onFiltersApply]);

  /**
   * Mudar página (aplicação imediata)
   */
  const changePage = useCallback((page: number) => {
    const newFilters = { ...appliedFilters, currentPage: page };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    onFiltersApply?.(newFilters);
    
    if (isDev) console.log('📄 [VENDAS-ENVIO-FILTROS] Página alterada:', page);
  }, [appliedFilters, onFiltersApply]);

  /**
   * Mudar itens por página (aplicação imediata, reset para página 1)
   */
  const changeItemsPerPage = useCallback((itemsPerPage: number) => {
    const newFilters = { ...appliedFilters, itemsPerPage, currentPage: 1 };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    onFiltersApply?.(newFilters);
    
    if (isDev) console.log('📊 [VENDAS-ENVIO-FILTROS] Itens por página alterado:', itemsPerPage);
  }, [appliedFilters, onFiltersApply]);

  /**
   * Mudar tab ativa (aplicação imediata, reset para página 1)
   */
  const changeTab = useCallback((tab: 'ativas' | 'historico') => {
    const newFilters = { ...appliedFilters, activeTab: tab, currentPage: 1 };
    setDraftFilters(newFilters);
    setAppliedFilters(newFilters);
    onFiltersApply?.(newFilters);
    
    if (isDev) console.log('📑 [VENDAS-ENVIO-FILTROS] Tab alterada:', tab);
  }, [appliedFilters, onFiltersApply]);

  /**
   * Verificar se há mudanças pendentes
   */
  const hasPendingChanges = useMemo(() => {
    const draftKeys = Object.keys(draftFilters) as (keyof VendasComEnvioFilters)[];
    
    return draftKeys.some(key => {
      // Ignorar página na comparação de mudanças pendentes
      if (key === 'currentPage') return false;
      
      const draftValue = draftFilters[key];
      const appliedValue = appliedFilters[key];
      
      if (Array.isArray(draftValue) && Array.isArray(appliedValue)) {
        return JSON.stringify([...draftValue].sort()) !== JSON.stringify([...appliedValue].sort());
      }
      
      return draftValue !== appliedValue;
    });
  }, [draftFilters, appliedFilters]);

  /**
   * Contar filtros ativos
   */
  const activeFiltersCount = useMemo(() => {
    return Object.keys(appliedFilters).filter(key => {
      // Ignorar página, itens por página e tab na contagem
      if (key === 'currentPage' || key === 'itemsPerPage' || key === 'activeTab') return false;
      
      const value = appliedFilters[key as keyof VendasComEnvioFilters];
      const defaultValue = DEFAULT_FILTERS[key as keyof VendasComEnvioFilters];
      
      if (Array.isArray(value)) return value.length > 0;
      return value !== defaultValue;
    }).length;
  }, [appliedFilters]);

  const hasActiveFilters = activeFiltersCount > 0;
  const needsManualApplication = hasPendingChanges;

  /**
   * Converter para parâmetros da API
   */
  const apiParams = useMemo(() => {
    return {
      periodo: appliedFilters.periodo,
      selectedAccounts: appliedFilters.selectedAccounts,
      shippingStatus: appliedFilters.shippingStatus,
      searchTerm: appliedFilters.searchTerm,
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
    updateFilter: updateDraftFilter,
    applyFilters,
    cancelChanges,
    clearFilters,
    
    // Ações de navegação (aplicação imediata)
    changePage,
    changeItemsPerPage,
    changeTab,
    
    // Defaults para referência
    defaultFilters: DEFAULT_FILTERS,
  };
}
