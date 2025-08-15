import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { HistoricoFilters, HistoricoFiltersState } from '../types/historicoTypes';

interface UseHistoricoFiltersOptions {
  onFiltersChange?: (filters: HistoricoFilters) => void;
  debounceMs?: number;
  persistKey?: string;
  initialFilters?: HistoricoFilters;
}

export const useHistoricoFilters = (options: UseHistoricoFiltersOptions = {}) => {
  const {
    onFiltersChange,
    debounceMs = 300,
    persistKey = 'historico-filters',
    initialFilters = {}
  } = options;

  // Estado dos filtros
  const [filtersState, setFiltersState] = useState<HistoricoFiltersState>(() => {
    // Tentar carregar filtros salvos
    if (persistKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(persistKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...initialFilters,
            ...parsed,
            isActive: Object.values(parsed).some(v => 
              Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
            ),
            sortBy: parsed.sortBy || 'data_pedido',
            sortOrder: parsed.sortOrder || 'desc'
          };
        }
      } catch (error) {
        console.warn('Erro ao carregar filtros salvos:', error);
      }
    }

    return {
      ...initialFilters,
      isActive: false,
      sortBy: 'data_pedido',
      sortOrder: 'desc'
    };
  });

  // Estados individuais para inputs
  const [searchTerm, setSearchTerm] = useState(filtersState.search || '');
  const [tempDateRange, setTempDateRange] = useState({
    start: filtersState.dataInicio || '',
    end: filtersState.dataFim || ''
  });

  // Debounce para busca e filtros
  const debouncedSearch = useDebounce(searchTerm, debounceMs);
  const debouncedDateRange = useDebounce(tempDateRange, debounceMs);

  // Atualizar filtros quando debounced values mudarem
  useEffect(() => {
    if (debouncedSearch !== filtersState.search) {
      updateFilter('search', debouncedSearch || undefined);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (
      debouncedDateRange.start !== filtersState.dataInicio ||
      debouncedDateRange.end !== filtersState.dataFim
    ) {
      updateFilter('dataInicio', debouncedDateRange.start || undefined);
      updateFilter('dataFim', debouncedDateRange.end || undefined);
    }
  }, [debouncedDateRange]);

  // Função para atualizar um filtro específico
  const updateFilter = useCallback((key: keyof HistoricoFilters, value: any) => {
    setFiltersState(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Verificar se há filtros ativos
      const hasActiveFilters = Object.entries(newFilters).some(([k, v]) => {
        if (k === 'isActive' || k === 'sortBy' || k === 'sortOrder') return false;
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      });

      newFilters.isActive = hasActiveFilters;

      // Persistir se configurado
      if (persistKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(persistKey, JSON.stringify(newFilters));
        } catch (error) {
          console.warn('Erro ao salvar filtros:', error);
        }
      }

      return newFilters;
    });
  }, [persistKey]);

  // Função para atualizar múltiplos filtros
  const updateFilters = useCallback((updates: Partial<HistoricoFilters>) => {
    setFiltersState(prev => {
      const newFilters = { ...prev, ...updates };
      
      // Atualizar estados locais se necessário
      if (updates.search !== undefined) {
        setSearchTerm(updates.search || '');
      }
      if (updates.dataInicio !== undefined || updates.dataFim !== undefined) {
        setTempDateRange({
          start: updates.dataInicio || prev.dataInicio || '',
          end: updates.dataFim || prev.dataFim || ''
        });
      }

      const hasActiveFilters = Object.entries(newFilters).some(([k, v]) => {
        if (k === 'isActive' || k === 'sortBy' || k === 'sortOrder') return false;
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== '';
      });

      newFilters.isActive = hasActiveFilters;

      if (persistKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(persistKey, JSON.stringify(newFilters));
        } catch (error) {
          console.warn('Erro ao salvar filtros:', error);
        }
      }

      return newFilters;
    });
  }, [persistKey]);

  // Limpar todos os filtros
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      ...initialFilters,
      isActive: false,
      sortBy: filtersState.sortBy,
      sortOrder: filtersState.sortOrder
    };

    setFiltersState(clearedFilters);
    setSearchTerm('');
    setTempDateRange({ start: '', end: '' });

    if (persistKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(persistKey);
      } catch (error) {
        console.warn('Erro ao limpar filtros salvos:', error);
      }
    }
  }, [initialFilters, filtersState.sortBy, filtersState.sortOrder, persistKey]);

  // Presets de data comum
  const applyDatePreset = useCallback((preset: 'today' | 'yesterday' | 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'week':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      default:
        return;
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setTempDateRange({ start: startStr, end: endStr });
    updateFilters({
      dataInicio: startStr,
      dataFim: endStr
    });
  }, [updateFilters]);

  // Callback quando filtros mudarem
  useEffect(() => {
    if (onFiltersChange) {
      const { isActive, sortBy, sortOrder, ...cleanFilters } = filtersState;
      onFiltersChange(cleanFilters);
    }
  }, [filtersState, onFiltersChange]);

  // Filtros ativos para exibição
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (filtersState.search) {
      active.push({
        key: 'search',
        label: 'Busca',
        value: filtersState.search
      });
    }

    if (filtersState.dataInicio || filtersState.dataFim) {
      const start = filtersState.dataInicio || 'início';
      const end = filtersState.dataFim || 'hoje';
      active.push({
        key: 'dateRange',
        label: 'Período',
        value: `${start} até ${end}`
      });
    }

    if (filtersState.status?.length) {
      active.push({
        key: 'status',
        label: 'Status',
        value: filtersState.status.join(', ')
      });
    }

    if (filtersState.valorMin !== undefined || filtersState.valorMax !== undefined) {
      const min = filtersState.valorMin || 0;
      const max = filtersState.valorMax || '∞';
      active.push({
        key: 'valor',
        label: 'Valor',
        value: `R$ ${min} - ${max}`
      });
    }

    if (filtersState.cidades?.length) {
      active.push({
        key: 'cidades',
        label: 'Cidades',
        value: filtersState.cidades.slice(0, 2).join(', ') + 
               (filtersState.cidades.length > 2 ? ` +${filtersState.cidades.length - 2}` : '')
      });
    }

    if (filtersState.uf?.length) {
      active.push({
        key: 'uf',
        label: 'Estados',
        value: filtersState.uf.join(', ')
      });
    }

    return active;
  }, [filtersState]);

  return {
    // Estado dos filtros
    filters: filtersState,
    activeFilters,
    hasActiveFilters: filtersState.isActive,

    // Estados dos inputs
    searchTerm,
    tempDateRange,

    // Ações
    updateFilter,
    updateFilters,
    clearFilters,
    applyDatePreset,

    // Handlers para inputs
    setSearchTerm,
    setTempDateRange,

    // Utilitários
    isSearching: searchTerm !== debouncedSearch,
    isUpdatingDates: tempDateRange !== debouncedDateRange
  };
};