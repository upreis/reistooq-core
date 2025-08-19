import { useState, useMemo } from 'react';
import { PedidosFiltersState } from '@/components/pedidos/PedidosFilters';

export function usePedidosFilters() {
  const [filters, setFilters] = useState<PedidosFiltersState>({});

  const clearFilters = () => {
    setFilters({});
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