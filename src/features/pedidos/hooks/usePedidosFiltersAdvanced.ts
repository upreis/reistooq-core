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

// ===== HOOK =====
export function usePedidosFiltersAdvanced() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<PedidosFiltersAdvanced>(DEFAULT_FILTERS);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Debounce search for performance
  const debouncedSearch = useDebounce(filters.search, 300);

  // URL Synchronization
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, []);

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== null && v !== '');
      }
      return value !== '' && value !== null && value !== 'all';
    });

    if (hasActiveFilters) {
      const urlParams = encodeFiltersToUrl(filters);
      setSearchParams(urlParams, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [filters, setSearchParams]);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pedidos-saved-filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // API Parameters conversion
  const apiParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Search
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    // Status
    if (filters.situacao.length > 0) {
      params.status = filters.situacao;
    }

    // Date range
    if (filters.dateRange.inicio) {
      params.dateFrom = filters.dateRange.inicio.toISOString().split('T')[0];
    }
    if (filters.dateRange.fim) {
      params.dateTo = filters.dateRange.fim.toISOString().split('T')[0];
    }

    // Location
    if (filters.cidade.length > 0) {
      params.cities = filters.cidade;
    }
    if (filters.uf.length > 0) {
      params.states = filters.uf;
    }

    // Value range
    if (filters.valorRange.min !== null) {
      params.minValue = filters.valorRange.min;
    }
    if (filters.valorRange.max !== null) {
      params.maxValue = filters.valorRange.max;
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

    return params;
  }, [debouncedSearch, filters]);

  // Filter management functions
  const updateFilter = useCallback(<K extends keyof PedidosFiltersAdvanced>(
    key: K,
    value: PedidosFiltersAdvanced[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActivePreset(null); // Clear preset when manual filter is applied
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActivePreset(null);
  }, []);

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
  }, []);

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
    setFilters({ ...DEFAULT_FILTERS, ...savedFilter.filters });
    setActivePreset(null);

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
    
    // Presets
    presets: DEFAULT_FILTER_PRESETS
  };
}

// ===== HELPER FUNCTIONS =====
function parseFiltersFromUrl(searchParams: URLSearchParams): Partial<PedidosFiltersAdvanced> {
  const filters: Partial<PedidosFiltersAdvanced> = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const status = searchParams.get('status');
  if (status) filters.situacao = status.split(',');

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  if (dateFrom || dateTo) {
    filters.dateRange = {
      inicio: dateFrom ? new Date(dateFrom) : null,
      fim: dateTo ? new Date(dateTo) : null,
      preset: null
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

  if (filters.dateRange.inicio) {
    params.set('dateFrom', filters.dateRange.inicio.toISOString().split('T')[0]);
  }

  if (filters.dateRange.fim) {
    params.set('dateTo', filters.dateRange.fim.toISOString().split('T')[0]);
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
    
    default:
      return { inicio: start, fim: end };
  }

  return { inicio: start, fim: end };
}