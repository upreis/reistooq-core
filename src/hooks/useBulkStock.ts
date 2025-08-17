import { useState, useCallback, useMemo } from 'react';
import { orderService, BulkStockPayload, Order } from '@/services/OrderService';
import { toast } from '@/hooks/use-toast';

interface StockEligibility {
  canProcess: boolean;
  reason?: string;
}

interface UseBulkStockReturn {
  isProcessing: boolean;
  selectedOrders: string[];
  eligibleOrders: string[];
  
  // Selection actions
  selectOrder: (orderId: string) => void;
  unselectOrder: (orderId: string) => void;
  selectAll: (orders: Order[]) => void;
  clearSelection: () => void;
  
  // Stock actions
  bulkBaixarEstoque: () => Promise<void>;
  bulkCancelarPedidos: () => Promise<void>;
  
  // Validation
  getStockEligibility: (order: Order) => StockEligibility;
  canProcessSelected: boolean;
}

export function useBulkStock(orders: Order[]): UseBulkStockReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  // Determine which orders are eligible for stock operations
  const getStockEligibility = useCallback((order: Order): StockEligibility => {
    // Business rules for stock processing eligibility
    const validStatuses = ['Pago', 'Aprovado', 'Pendente'];
    const invalidStatuses = ['Cancelado', 'Devolvido', 'Reembolsado'];
    
    if (invalidStatuses.includes(order.situacao)) {
      return { canProcess: false, reason: 'Status não permite processamento' };
    }
    
    if (!validStatuses.includes(order.situacao)) {
      return { canProcess: false, reason: 'Status inválido para baixa de estoque' };
    }
    
    // Check if order is already processed (simplified logic)
    if (order.obs_interna?.includes('ESTOQUE_BAIXADO')) {
      return { canProcess: false, reason: 'Estoque já baixado' };
    }
    
    return { canProcess: true };
  }, []);
  
  // Calculate eligible orders
  const eligibleOrders = useMemo(() => 
    orders.filter(order => getStockEligibility(order).canProcess).map(order => order.id),
    [orders, getStockEligibility]
  );
  
  // Can process if at least one selected order is eligible
  const canProcessSelected = useMemo(() => 
    selectedOrders.some(id => eligibleOrders.includes(id)),
    [selectedOrders, eligibleOrders]
  );
  
  // Selection actions
  const selectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev : [...prev, orderId]);
  }, []);
  
  const unselectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => prev.filter(id => id !== orderId));
  }, []);
  
  const selectAll = useCallback((orders: Order[]) => {
    const eligibleIds = orders
      .filter(order => getStockEligibility(order).canProcess)
      .map(order => order.id);
    setSelectedOrders(eligibleIds);
  }, [getStockEligibility]);
  
  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);
  
  // Bulk processing helper
  const processBulkAction = useCallback(async (action: 'baixar_estoque' | 'cancelar_pedido') => {
    if (isProcessing || !canProcessSelected) return;
    
    const eligibleSelected = selectedOrders.filter(id => eligibleOrders.includes(id));
    
    if (eligibleSelected.length === 0) {
      toast({
        title: "Nenhum pedido elegível",
        description: "Selecione pedidos válidos para processamento.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const payload: BulkStockPayload = {
        orderIds: eligibleSelected,
        action,
      };
      
      // Show confirmation for destructive actions
      if (action === 'cancelar_pedido') {
        const confirmed = window.confirm(
          `Tem certeza que deseja cancelar ${eligibleSelected.length} pedido(s)? Esta ação não pode ser desfeita.`
        );
        if (!confirmed) return;
      }
      
      toast({
        title: "Processando...",
        description: `Processando ${eligibleSelected.length} pedido(s)...`,
      });
      
      await orderService.bulkStock(payload);
      
      toast({
        title: "Processamento concluído",
        description: `${eligibleSelected.length} pedido(s) processado(s) com sucesso.`,
      });
      
      // Clear selection after successful processing
      clearSelection();
      
    } catch (error: any) {
      console.error('Bulk processing error:', error);
      toast({
        title: "Erro no processamento",
        description: error.message || "Não foi possível processar os pedidos em lote.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, canProcessSelected, selectedOrders, eligibleOrders, clearSelection]);
  
  // Action handlers
  const bulkBaixarEstoque = useCallback(() => 
    processBulkAction('baixar_estoque'), 
    [processBulkAction]
  );
  
  const bulkCancelarPedidos = useCallback(() => 
    processBulkAction('cancelar_pedido'), 
    [processBulkAction]
  );
  
  return {
    isProcessing,
    selectedOrders,
    eligibleOrders,
    
    // Selection
    selectOrder,
    unselectOrder,
    selectAll,
    clearSelection,
    
    // Actions
    bulkBaixarEstoque,
    bulkCancelarPedidos,
    
    // Validation
    getStockEligibility,
    canProcessSelected,
  };
}