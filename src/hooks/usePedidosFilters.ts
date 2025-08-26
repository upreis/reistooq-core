import { useState, useMemo, useEffect } from 'react';
import { PedidosFiltersState } from '@/components/pedidos/PedidosFilters';

const STORAGE_KEY = 'pedidos_last_filters';

// Função para carregar filtros do localStorage
const loadFiltersFromStorage = (): PedidosFiltersState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
    // Converter strings de data de volta para objetos Date
    if (parsed.dataInicio) {
      parsed.dataInicio = new Date(parsed.dataInicio);
    }
    if (parsed.dataFim) {
      parsed.dataFim = new Date(parsed.dataFim);
    }
    
    return parsed;
  } catch (error) {
    console.warn('Erro ao carregar filtros salvos:', error);
    return {};
  }
};

// Função para salvar filtros no localStorage
const saveFiltersToStorage = (filters: PedidosFiltersState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.warn('Erro ao salvar filtros:', error);
  }
};

export function usePedidosFilters() {
  const [filters, setFilters] = useState<PedidosFiltersState>(loadFiltersFromStorage);

  // Salvar filtros no localStorage sempre que mudarem
  useEffect(() => {
    saveFiltersToStorage(filters);
  }, [filters]);

  const clearFilters = () => {
    setFilters({});
    localStorage.removeItem(STORAGE_KEY);
  };

  // Converte filtros para parâmetros da API
  const apiParams = useMemo(() => {
    const params: any = {};

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.situacao) {
      params.situacao = filters.situacao;
    }

    if (filters.dataInicio) {
      params.dataInicio = filters.dataInicio.toISOString().split('T')[0];
    }

    if (filters.dataFim) {
      params.dataFim = filters.dataFim.toISOString().split('T')[0];
    }

    if (filters.cidade) {
      params.cidade = filters.cidade;
    }

    if (filters.uf) {
      params.uf = filters.uf;
    }

    if (filters.valorMin) {
      params.valorMin = filters.valorMin;
    }

    if (filters.valorMax) {
      params.valorMax = filters.valorMax;
    }

    return params;
  }, [filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    apiParams,
    hasActiveFilters: Object.keys(filters).some(key => filters[key as keyof PedidosFiltersState] !== undefined)
  };
}