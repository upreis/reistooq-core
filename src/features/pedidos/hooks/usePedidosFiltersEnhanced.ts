import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

// ===== TYPES =====
export interface PedidosFiltersAdvanced {
  // Basic filters
  search: string;
  situacao: string[];
  dateRange: {
    inicio: Date | null;
    fim: Date | null;
    preset: string | null;
  };
  
  // Advanced filters
  cidade: string[];
  uf: string[];
  valorRange: {
    min: number | null;
    max: number | null;
  };
  
  // Smart filters
  tags: string[];
  priority: 'all' | 'high' | 'medium' | 'low';
  hasMapping: boolean | null;
  
  // Meta filters
  source: 'all' | 'mercadolivre' | 'shopify' | 'custom';
  createdBy: string[];
  lastModified: {
    hours: number | null;
    days: number | null;
  };
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Partial<PedidosFiltersAdvanced>;
  isDefault?: boolean;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  tags: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  filters: Partial<PedidosFiltersAdvanced>;
  color: string;
}

export interface FilterAnalytics {
  mostUsedFilters: string[];
  averageFilterCount: number;
  quickFilterUsage: Record<string, number>;
  searchTerms: string[];
  dateRangeUsage: Record<string, number>;
}

// ===== PRESETS =====
export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'hoje',
    name: 'Pedidos de Hoje',
    description: 'Pedidos criados hoje',
    icon: 'Calendar',
    color: 'blue',
    filters: {
      dateRange: {
        inicio: new Date(),
        fim: new Date(),
        preset: 'hoje'
      }
    }
  },
  {
    id: 'pendentes',
    name: 'Pendentes',
    description: 'Pedidos aguardando processamento',
    icon: 'Clock',
    color: 'amber',
    filters: {
      situacao: ['Pendente', 'Aguardando']
    }
  },
  {
    id: 'alto_valor',
    name: 'Alto Valor',
    description: 'Pedidos acima de R$ 500',
    icon: 'TrendingUp',
    color: 'green',
    filters: {
      valorRange: {
        min: 500,
        max: null
      }
    }
  },
  {
    id: 'sem_mapeamento',
    name: 'Sem Mapeamento',
    description: 'Pedidos sem SKU mapeado',
    icon: 'AlertTriangle',
    color: 'red',
    filters: {
      hasMapping: false
    }
  },
  {
    id: 'esta_semana',
    name: 'Esta Semana',
    description: 'Pedidos da semana atual',
    icon: 'CalendarDays',
    color: 'purple',
    filters: {
      dateRange: {
        inicio: null,
        fim: null,
        preset: 'esta_semana'
      }
    }
  },
  {
    id: 'sp_rj',
    name: 'SP + RJ',
    description: 'Pedidos de São Paulo e Rio',
    icon: 'MapPin',
    color: 'indigo',
    filters: {
      uf: ['SP', 'RJ']
    }
  },
  {
    id: 'pagos_enviados',
    name: 'Pagos/Enviados',
    description: 'Pedidos pagos e enviados',
    icon: 'CheckCircle',
    color: 'emerald',
    filters: {
      situacao: ['Pago', 'Enviado', 'Confirmado']
    }
  },
  {
    id: 'problemas',
    name: 'Com Problemas',
    description: 'Cancelados e devolvidos',
    icon: 'AlertCircle',
    color: 'red',
    filters: {
      situacao: ['Cancelado', 'Devolvido', 'Reembolsado']
    }
  }
];

// ===== DEFAULT STATE =====
const DEFAULT_FILTERS: PedidosFiltersAdvanced = {
  search: '',
  situacao: [],
  dateRange: {
    inicio: null,
    fim: null,
    preset: null
  },
  cidade: [],
  uf: [],
  valorRange: {
    min: null,
    max: null
  },
  tags: [],
  priority: 'all',
  hasMapping: null,
  source: 'all',
  createdBy: [],
  lastModified: {
    hours: null,
    days: null
  }
};

// ===== HOOK PRINCIPAL =====
export function usePedidosFiltersEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PedidosFiltersAdvanced>(DEFAULT_FILTERS);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [filterHistory, setFilterHistory] = useState<PedidosFiltersAdvanced[]>([]);
  const [analytics, setAnalytics] = useState<FilterAnalytics>({
    mostUsedFilters: [],
    averageFilterCount: 0,
    quickFilterUsage: {},
    searchTerms: [],
    dateRangeUsage: {}
  });

  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // FASE 1: URL Synchronization
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, []);

  useEffect(() => {
    const hasActiveFilters = hasActiveFiltersCheck(filters);
    if (hasActiveFilters) {
      const urlParams = encodeFiltersToUrl(filters);
      setSearchParams(urlParams, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [filters, setSearchParams]);

  // FASE 2: Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pedidos-saved-filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }

    const history = localStorage.getItem('pedidos-filter-history');
    if (history) {
      try {
        setFilterHistory(JSON.parse(history));
      } catch (error) {
        console.error('Error loading filter history:', error);
      }
    }

    const analyticsData = localStorage.getItem('pedidos-filter-analytics');
    if (analyticsData) {
      try {
        setAnalytics(JSON.parse(analyticsData));
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }
  }, []);

  // FASE 3: Track analytics
  useEffect(() => {
    if (hasActiveFiltersCheck(filters)) {
      trackFilterUsage(filters);
    }
  }, [debouncedSearch, filters.situacao, filters.dateRange, filters.uf]);

  // API Parameters conversion with enhanced mapping
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Search with enhanced mapping
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
      params.q = debouncedSearch.trim(); // Fallback for ML API
    }

    // Multi-select status
    if (filters.situacao.length > 0) {
      params.status = filters.situacao;
      params.situacao = filters.situacao; // Fallback
    }

    // Enhanced date range
    if (filters.dateRange.inicio) {
      params.dateFrom = filters.dateRange.inicio.toISOString().split('T')[0];
      params.dataInicio = filters.dateRange.inicio;
    }
    if (filters.dateRange.fim) {
      params.dateTo = filters.dateRange.fim.toISOString().split('T')[0];
      params.dataFim = filters.dateRange.fim;
    }

    // Multi-select location
    if (filters.cidade.length > 0) {
      params.cities = filters.cidade;
      params.cidade = filters.cidade[0]; // Fallback for single
    }
    if (filters.uf.length > 0) {
      params.states = filters.uf;
      params.uf = filters.uf[0]; // Fallback for single
    }

    // Enhanced value range
    if (filters.valorRange.min !== null) {
      params.minValue = filters.valorRange.min;
      params.valorMin = filters.valorRange.min;
    }
    if (filters.valorRange.max !== null) {
      params.maxValue = filters.valorRange.max;
      params.valorMax = filters.valorRange.max;
    }

    // Advanced params
    if (filters.hasMapping !== null) {
      params.hasMapping = filters.hasMapping;
    }
    if (filters.source !== 'all') {
      params.source = filters.source;
    }
    if (filters.priority !== 'all') {
      params.priority = filters.priority;
    }
    if (filters.tags.length > 0) {
      params.tags = filters.tags;
    }

    return params;
  }, [debouncedSearch, filters]);

  // Filter management functions
  const updateFilter = useCallback(<K extends keyof PedidosFiltersAdvanced>(
    key: K,
    value: PedidosFiltersAdvanced[K]
  ) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Add to history
      if (hasActiveFiltersCheck(newFilters)) {
        addToHistory(newFilters);
      }
      
      return newFilters;
    });
    setActivePreset(null); // Clear preset when manual filter is applied
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActivePreset(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const applyPreset = useCallback((preset: FilterPreset) => {
    const appliedFilters = { ...DEFAULT_FILTERS, ...preset.filters };
    
    // Handle date presets
    if (preset.filters.dateRange?.preset) {
      const dates = calculateDateRange(preset.filters.dateRange.preset);
      appliedFilters.dateRange = {
        ...appliedFilters.dateRange,
        ...dates
      };
    }

    setFilters(appliedFilters);
    setActivePreset(preset.id);
    
    // Track preset usage
    trackPresetUsage(preset.id);
    addToHistory(appliedFilters);
  }, []);

  // FASE 2: Saved filters management
  const saveFilter = useCallback((name: string, description?: string, isPublic = false) => {
    const newSavedFilter: SavedFilter = {
      id: `filter_${Date.now()}`,
      name,
      description,
      filters,
      isPublic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      tags: []
    };

    const updatedSaved = [...savedFilters, newSavedFilter];
    setSavedFilters(updatedSaved);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updatedSaved));

    return newSavedFilter;
  }, [filters, savedFilters]);

  const loadSavedFilter = useCallback((savedFilter: SavedFilter) => {
    const appliedFilters = { ...DEFAULT_FILTERS, ...savedFilter.filters };
    setFilters(appliedFilters);
    setActivePreset(null);
    addToHistory(appliedFilters);

    // Increment usage count
    const updatedSaved = savedFilters.map(sf =>
      sf.id === savedFilter.id
        ? { ...sf, usageCount: sf.usageCount + 1 }
        : sf
    );
    setSavedFilters(updatedSaved);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updatedSaved));
  }, [savedFilters]);

  const deleteSavedFilter = useCallback((filterId: string) => {
    const updatedSaved = savedFilters.filter(sf => sf.id !== filterId);
    setSavedFilters(updatedSaved);
    localStorage.setItem('pedidos-saved-filters', JSON.stringify(updatedSaved));
  }, [savedFilters]);

  // FASE 3: Advanced features
  const addToHistory = useCallback((newFilters: PedidosFiltersAdvanced) => {
    setFilterHistory(prev => {
      const updated = [newFilters, ...prev.filter(f => JSON.stringify(f) !== JSON.stringify(newFilters))].slice(0, 10);
      localStorage.setItem('pedidos-filter-history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const trackFilterUsage = useCallback((usedFilters: PedidosFiltersAdvanced) => {
    setAnalytics(prev => {
      const updated = { ...prev };
      
      // Track search terms
      if (usedFilters.search) {
        updated.searchTerms = [...new Set([usedFilters.search, ...prev.searchTerms])].slice(0, 20);
      }
      
      // Track most used filters
      Object.keys(usedFilters).forEach(key => {
        const value = usedFilters[key as keyof PedidosFiltersAdvanced];
        if (value && value !== 'all' && (!Array.isArray(value) || value.length > 0)) {
          updated.mostUsedFilters = [key, ...prev.mostUsedFilters.filter(f => f !== key)].slice(0, 10);
        }
      });

      localStorage.setItem('pedidos-filter-analytics', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const trackPresetUsage = useCallback((presetId: string) => {
    setAnalytics(prev => {
      const updated = {
        ...prev,
        quickFilterUsage: {
          ...prev.quickFilterUsage,
          [presetId]: (prev.quickFilterUsage[presetId] || 0) + 1
        }
      };
      localStorage.setItem('pedidos-filter-analytics', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get suggestions based on analytics
  const getSearchSuggestions = useCallback(() => {
    return analytics.searchTerms.slice(0, 5);
  }, [analytics.searchTerms]);

  const getCidadeSuggestions = useCallback(() => {
    // In a real app, this would come from API
    return ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador'];
  }, []);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.search.trim()) count++;
    if (filters.situacao.length > 0) count++;
    if (filters.dateRange.inicio || filters.dateRange.fim) count++;
    if (filters.cidade.length > 0) count++;
    if (filters.uf.length > 0) count++;
    if (filters.valorRange.min !== null || filters.valorRange.max !== null) count++;
    if (filters.hasMapping !== null) count++;
    if (filters.source !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.tags.length > 0) count++;

    return count;
  }, [filters]);

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    // State
    filters,
    savedFilters,
    activePreset,
    filterHistory,
    analytics,
    
    // API
    apiParams,
    
    // Stats
    activeFiltersCount,
    hasActiveFilters,
    
    // Actions
    updateFilter,
    clearFilters,
    applyPreset,
    saveFilter,
    loadSavedFilter,
    deleteSavedFilter,
    
    // Suggestions
    getSearchSuggestions,
    getCidadeSuggestions,
    
    // Presets
    presets: DEFAULT_FILTER_PRESETS
  };
}

// ===== HELPER FUNCTIONS =====
function hasActiveFiltersCheck(filters: PedidosFiltersAdvanced): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'search') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== null && v !== '');
    }
    return value !== '' && value !== null && value !== 'all';
  });
}

function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<PedidosFiltersAdvanced> {
  const filters: Partial<PedidosFiltersAdvanced> = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const status = searchParams.get('status');
  if (status) filters.situacao = status.split(',');

  const uf = searchParams.get('uf');
  if (uf) filters.uf = uf.split(',');

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    filters.dateRange = {
      inicio: dateFrom ? new Date(dateFrom) : null,
      fim: dateTo ? new Date(dateTo) : null,
      preset: null
    };
  }

  const minValue = searchParams.get('minValue');
  const maxValue = searchParams.get('maxValue');
  if (minValue || maxValue) {
    filters.valorRange = {
      min: minValue ? parseFloat(minValue) : null,
      max: maxValue ? parseFloat(maxValue) : null
    };
  }

  return filters;
}

function encodeFiltersToUrl(filters: PedidosFiltersAdvanced): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.situacao.length > 0) {
    params.set('status', filters.situacao.join(','));
  }

  if (filters.uf.length > 0) {
    params.set('uf', filters.uf.join(','));
  }

  if (filters.dateRange.inicio) {
    params.set('dateFrom', filters.dateRange.inicio.toISOString().split('T')[0]);
  }

  if (filters.dateRange.fim) {
    params.set('dateTo', filters.dateRange.fim.toISOString().split('T')[0]);
  }

  if (filters.valorRange.min !== null) {
    params.set('minValue', filters.valorRange.min.toString());
  }

  if (filters.valorRange.max !== null) {
    params.set('maxValue', filters.valorRange.max.toString());
  }

  return params;
}

function calculateDateRange(preset: string): { inicio: Date; fim: Date } {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (preset) {
    case 'hoje':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    
    case 'esta_semana':
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    
    case 'este_mes':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;

    case 'ultimo_mes':
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    
    default:
      return { inicio: start, fim: end };
  }

  return { inicio: start, fim: end };
}