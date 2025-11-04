/**
 * 🎯 HOOK DE SELEÇÃO DE PEDIDOS - FASE 1 REFATORAÇÃO
 * Extrai toda lógica de seleção para hook dedicado
 * Reduz complexidade do componente principal
 */

import { useState, useCallback, useMemo } from 'react';

interface UsePedidosSelectionOptions {
  orders?: any[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function usePedidosSelection(options: UsePedidosSelectionOptions = {}) {
  const { orders = [], onSelectionChange } = options;
  
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  
  // ============= AÇÕES =============
  
  /**
   * Seleciona ou desseleciona um pedido
   */
  const toggleOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => {
      const newSelection = new Set(prev);
      
      if (newSelection.has(orderId)) {
        newSelection.delete(orderId);
      } else {
        newSelection.add(orderId);
      }
      
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);
  
  /**
   * Seleciona múltiplos pedidos de uma vez
   */
  const selectMultiple = useCallback((orderIds: string[]) => {
    setSelectedOrders(prev => {
      const newSelection = new Set(prev);
      orderIds.forEach(id => newSelection.add(id));
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);
  
  /**
   * Remove múltiplos pedidos da seleção
   */
  const unselectMultiple = useCallback((orderIds: string[]) => {
    setSelectedOrders(prev => {
      const newSelection = new Set(prev);
      orderIds.forEach(id => newSelection.delete(id));
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [onSelectionChange]);
  
  /**
   * Seleciona todos os pedidos visíveis
   */
  const selectAll = useCallback(() => {
    const allIds = orders.map(order => order.id).filter(Boolean);
    const newSelection = new Set(allIds);
    setSelectedOrders(newSelection);
    onSelectionChange?.(newSelection);
  }, [orders, onSelectionChange]);
  
  /**
   * Limpa toda seleção
   */
  const clearSelection = useCallback(() => {
    setSelectedOrders(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);
  
  /**
   * Inverte a seleção (seleciona não selecionados e vice-versa)
   */
  const invertSelection = useCallback(() => {
    setSelectedOrders(prev => {
      const allIds = orders.map(order => order.id).filter(Boolean);
      const newSelection = new Set<string>();
      
      allIds.forEach(id => {
        if (!prev.has(id)) {
          newSelection.add(id);
        }
      });
      
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  }, [orders, onSelectionChange]);
  
  /**
   * Seleciona apenas pedidos que atendem uma condição
   */
  const selectWhere = useCallback((predicate: (order: any) => boolean) => {
    const matchingIds = orders
      .filter(predicate)
      .map(order => order.id)
      .filter(Boolean);
    
    const newSelection = new Set(matchingIds);
    setSelectedOrders(newSelection);
    onSelectionChange?.(newSelection);
  }, [orders, onSelectionChange]);
  
  // ============= COMPUTED =============
  
  /**
   * Quantidade de pedidos selecionados
   */
  const selectedCount = selectedOrders.size;
  
  /**
   * Verifica se algum pedido está selecionado
   */
  const hasSelection = selectedCount > 0;
  
  /**
   * Verifica se todos pedidos visíveis estão selecionados
   */
  const isAllSelected = useMemo(() => {
    if (orders.length === 0) return false;
    return orders.every(order => selectedOrders.has(order.id));
  }, [orders, selectedOrders]);
  
  /**
   * Verifica se alguns (mas não todos) pedidos estão selecionados
   */
  const isPartiallySelected = useMemo(() => {
    return hasSelection && !isAllSelected;
  }, [hasSelection, isAllSelected]);
  
  /**
   * Lista de IDs selecionados como array
   */
  const selectedIds = useMemo(() => {
    return Array.from(selectedOrders);
  }, [selectedOrders]);
  
  /**
   * Objetos dos pedidos selecionados
   */
  const selectedOrderObjects = useMemo(() => {
    return orders.filter(order => selectedOrders.has(order.id));
  }, [orders, selectedOrders]);
  
  /**
   * Verifica se um pedido específico está selecionado
   */
  const isSelected = useCallback((orderId: string) => {
    return selectedOrders.has(orderId);
  }, [selectedOrders]);
  
  // ============= HELPERS DE SELEÇÃO INTELIGENTE =============
  
  /**
   * Seleciona apenas pedidos prontos para baixar
   */
  const selectReadyToProcess = useCallback((mappingData: Map<string, any>, isPedidoProcessado: (order: any) => boolean) => {
    selectWhere((order) => {
      const id = order.id;
      const mapping = mappingData.get(id);
      const temMapeamentoCompleto = !!(mapping && (mapping.skuEstoque || mapping.skuKit));
      const baixado = isPedidoProcessado(order);
      const semProblemas = mapping?.statusBaixa !== 'sku_nao_cadastrado' && mapping?.statusBaixa !== 'sem_estoque';
      
      return temMapeamentoCompleto && !baixado && semProblemas;
    });
  }, [selectWhere]);
  
  /**
   * Seleciona apenas pedidos com problemas
   */
  const selectWithIssues = useCallback((mappingData: Map<string, any>) => {
    selectWhere((order) => {
      const mapping = mappingData.get(order.id);
      return mapping?.statusBaixa === 'sku_nao_cadastrado' || 
             mapping?.statusBaixa === 'sem_estoque' ||
             mapping?.statusBaixa === 'sem_composicao';
    });
  }, [selectWhere]);
  
  /**
   * Seleciona apenas pedidos de um status específico
   */
  const selectByStatus = useCallback((status: string) => {
    selectWhere((order) => {
      const orderStatus = order.situacao || order.status || '';
      return orderStatus.toLowerCase() === status.toLowerCase();
    });
  }, [selectWhere]);
  
  return {
    // Estado
    selectedOrders,
    selectedIds,
    selectedOrderObjects,
    selectedCount,
    hasSelection,
    isAllSelected,
    isPartiallySelected,
    
    // Ações básicas
    toggleOrder,
    selectMultiple,
    unselectMultiple,
    selectAll,
    clearSelection,
    invertSelection,
    selectWhere,
    isSelected,
    
    // Ações inteligentes
    selectReadyToProcess,
    selectWithIssues,
    selectByStatus,
  };
}
