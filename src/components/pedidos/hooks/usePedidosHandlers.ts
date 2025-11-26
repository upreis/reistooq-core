/**
 * 🔧 FASE 4.1: Handlers e Callbacks de Pedidos
 * Extraído de SimplePedidosPage para reduzir complexidade
 * 
 * ✅ GARANTIA: Apenas callbacks de UI, sem lógica de API
 */

import { useCallback } from 'react';
import type { StatusFilters } from '@/features/orders/types/orders-status.types';

export interface UsePedidosHandlersProps {
  actions: any;
  persistentState: any;
  setQuickFilter: (filter: any) => void;
  setAdvancedStatusFilters: (filters: StatusFilters) => void;
}

export function usePedidosHandlers({
  actions,
  persistentState,
  setQuickFilter,
  setAdvancedStatusFilters,
}: UsePedidosHandlersProps) {
  
  /**
   * Handler para mudança de filtro rápido
   */
  const handleQuickFilterChange = useCallback((newFilter: any) => {
    setQuickFilter(newFilter);
    persistentState.saveQuickFilter(newFilter);
    
    // Forçar refresh dos dados para recalcular totais
    setTimeout(() => {
      actions.refetch();
    }, 100);
  }, [actions, persistentState, setQuickFilter]);

  /**
   * Handler para mudança de filtros gerais
   */
  const handleFilterChange = useCallback((newFilters: any) => {
    actions.setFilters(newFilters);
  }, [actions]);

  /**
   * Handler para baixa de estoque
   */
  const handleBaixaEstoque = useCallback(async (pedidos: string[]) => {
    console.log('Iniciando baixa de estoque para:', pedidos);
    // Lógica de baixa de estoque gerenciada pelos componentes especializados
  }, []);

  /**
   * Handler para mudança de filtros avançados de status
   */
  const handleAdvancedStatusFiltersChange = useCallback((filters: StatusFilters) => {
    setAdvancedStatusFilters(filters);
  }, [setAdvancedStatusFilters]);

  /**
   * Handler para reset de filtros avançados de status
   */
  const handleResetAdvancedStatusFilters = useCallback(() => {
    setAdvancedStatusFilters({
      orderStatus: [],
      shippingStatus: [],
      shippingSubstatus: [],
      returnStatus: []
    });
  }, [setAdvancedStatusFilters]);

  return {
    handleQuickFilterChange,
    handleFilterChange,
    handleBaixaEstoque,
    handleAdvancedStatusFiltersChange,
    handleResetAdvancedStatusFilters,
  };
}
