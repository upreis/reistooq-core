import { useState, useMemo } from 'react';
import { PedidosFiltersState } from '@/components/pedidos/PedidosFilters';

export function usePedidosFilters() {
  const [appliedFilters, setAppliedFilters] = useState<PedidosFiltersState>({});
  const [draftFilters, setDraftFilters] = useState<PedidosFiltersState>({});

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
  };

  const clearFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
  };

  const cancelChanges = () => {
    setDraftFilters(appliedFilters);
  };

  // Converte filtros aplicados para parâmetros da API
  const apiParams = useMemo(() => {
    const params: any = {};

    if (appliedFilters.search) {
      params.search = appliedFilters.search;
    }

    if (appliedFilters.situacao) {
      params.situacao = appliedFilters.situacao;
    }

    if (appliedFilters.dataInicio) {
      params.dataInicio = appliedFilters.dataInicio.toISOString().split('T')[0];
    }

    if (appliedFilters.dataFim) {
      params.dataFim = appliedFilters.dataFim.toISOString().split('T')[0];
    }

    if (appliedFilters.cidade) {
      params.cidade = appliedFilters.cidade;
    }

    if (appliedFilters.uf) {
      params.uf = appliedFilters.uf;
    }

    if (appliedFilters.valorMin) {
      params.valorMin = appliedFilters.valorMin;
    }

    if (appliedFilters.valorMax) {
      params.valorMax = appliedFilters.valorMax;
    }

    return params;
  }, [appliedFilters]);

  return {
    appliedFilters,
    draftFilters,
    setDraftFilters,
    applyFilters,
    clearFilters,
    cancelChanges,
    apiParams,
    hasActiveFilters: Object.keys(appliedFilters).some(key => appliedFilters[key as keyof PedidosFiltersState] !== undefined),
    hasPendingChanges: JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters)
  };
}