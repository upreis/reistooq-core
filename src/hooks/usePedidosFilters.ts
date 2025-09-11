import { useState, useMemo, useEffect } from 'react';
import { PedidosFiltersState } from '@/components/pedidos/PedidosFilters';

const STORAGE_KEY = 'pedidos_last_filters';

// ✅ SIMPLIFICADO: Função para carregar filtros do localStorage
const loadFiltersFromStorage = (): PedidosFiltersState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const parsed = JSON.parse(stored);
    
  // ✅ CORRIGIDO: Converter strings de data de volta para objetos Date com timezone correto
    if (parsed.dataInicio) {
      if (typeof parsed.dataInicio === 'string' && parsed.dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Data no formato YYYY-MM-DD, criar sem timezone
        const [year, month, day] = parsed.dataInicio.split('-').map(Number);
        parsed.dataInicio = new Date(year, month - 1, day);
      } else {
        const date = new Date(parsed.dataInicio);
        parsed.dataInicio = isNaN(date.getTime()) ? undefined : date;
      }
    }
    if (parsed.dataFim) {
      if (typeof parsed.dataFim === 'string' && parsed.dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Data no formato YYYY-MM-DD, criar sem timezone
        const [year, month, day] = parsed.dataFim.split('-').map(Number);
        parsed.dataFim = new Date(year, month - 1, day);
      } else {
        const date = new Date(parsed.dataFim);
        parsed.dataFim = isNaN(date.getTime()) ? undefined : date;
      }
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

    if (filters.statusEnvio && filters.statusEnvio.length > 0) {
      params.statusEnvio = filters.statusEnvio;
    }

    if (filters.dataInicio) {
      // ✅ CORRIGIDO: Formatar data sem problemas de timezone
      const d = filters.dataInicio;
      params.dataInicio = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    if (filters.dataFim) {
      // ✅ CORRIGIDO: Formatar data sem problemas de timezone
      const d = filters.dataFim;
      params.dataFim = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

    if (filters.contasML && filters.contasML.length > 0) {
      params.contasML = filters.contasML; // ✅ Array de contas ML
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