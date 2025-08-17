import { useState, useCallback, useMemo } from 'react';
import { OrderAdvanced, BulkOperation, BulkOperationType } from '../types/orders-advanced.types';
import { OrdersBulkService } from '../services/OrdersBulkService';
import { useToast } from '@/hooks/use-toast';

interface UseOrdersBulkOptions {
  onSuccess?: (operation: BulkOperation) => void;
  onError?: (error: Error) => void;
}

interface UseOrdersBulkReturn {
  // Selection state
  selectedOrders: string[];
  eligibleOrders: string[];
  isAllSelected: boolean;
  hasSomeSelected: boolean;
  
  // Selection actions
  selectOrder: (orderId: string) => void;
  unselectOrder: (orderId: string) => void;
  selectAll: (orders: OrderAdvanced[]) => void;
  clearSelection: () => void;
  toggleOrder: (orderId: string) => void;
  
  // Bulk operations
  bulkUpdateStatus: (status: string) => Promise<void>;
  bulkLowStock: () => Promise<void>;
  bulkCancelOrders: () => Promise<void>;
  bulkExport: (format: 'csv' | 'xlsx' | 'pdf') => Promise<void>;
  
  // Operation state
  currentOperation: BulkOperation | null;
  isProcessing: boolean;
  progress: number;
  
  // Validation
  getEligibilityReasons: (orders: OrderAdvanced[]) => Record<string, string>;
  canPerformOperation: (operation: BulkOperationType) => boolean;
}

export function useOrdersBulk(
  allOrders: OrderAdvanced[],
  options: UseOrdersBulkOptions = {}
): UseOrdersBulkReturn {
  const { onSuccess, onError } = options;
  const { toast } = useToast();
  
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null);

  // Calculate eligible orders for each operation type
  const eligibleOrders = useMemo(() => {
    return allOrders
      .filter(order => OrdersBulkService.isEligibleForBulkOperations(order))
      .map(order => order.id);
  }, [allOrders]);

  // Selection state calculations
  const isAllSelected = useMemo(() => {
    return eligibleOrders.length > 0 && selectedOrders.length === eligibleOrders.length;
  }, [selectedOrders.length, eligibleOrders.length]);

  const hasSomeSelected = useMemo(() => {
    return selectedOrders.length > 0;
  }, [selectedOrders.length]);

  const isProcessing = useMemo(() => {
    return currentOperation?.status === 'processing';
  }, [currentOperation?.status]);

  const progress = useMemo(() => {
    if (!currentOperation) return 0;
    return Math.round((currentOperation.processed_items / currentOperation.total_items) * 100);
  }, [currentOperation]);

  // Selection actions
  const selectOrder = useCallback((orderId: string) => {
    if (!eligibleOrders.includes(orderId)) return;
    
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) return prev;
      return [...prev, orderId];
    });
  }, [eligibleOrders]);

  const unselectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => prev.filter(id => id !== orderId));
  }, []);

  const toggleOrder = useCallback((orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      unselectOrder(orderId);
    } else {
      selectOrder(orderId);
    }
  }, [selectedOrders, selectOrder, unselectOrder]);

  const selectAll = useCallback((orders: OrderAdvanced[]) => {
    const eligibleIds = orders
      .filter(order => OrdersBulkService.isEligibleForBulkOperations(order))
      .map(order => order.id);
    setSelectedOrders(eligibleIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrders([]);
  }, []);

  // Validation helpers
  const getEligibilityReasons = useCallback((orders: OrderAdvanced[]) => {
    const reasons: Record<string, string> = {};
    
    orders.forEach(order => {
      const eligibility = OrdersBulkService.getEligibilityReason(order);
      if (!eligibility.isEligible) {
        reasons[order.id] = eligibility.reason;
      }
    });
    
    return reasons;
  }, []);

  const canPerformOperation = useCallback((operation: BulkOperationType) => {
    if (selectedOrders.length === 0) return false;
    
    const selectedOrdersData = allOrders.filter(order => 
      selectedOrders.includes(order.id)
    );
    
    return selectedOrdersData.every(order => 
      OrdersBulkService.canPerformOperation(order, operation)
    );
  }, [selectedOrders, allOrders]);

  // Bulk operation handlers
  const executeOperation = useCallback(async (
    operation: BulkOperationType,
    additionalParams: Record<string, any> = {}
  ) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Nenhum pedido selecionado",
        description: "Selecione pelo menos um pedido para executar a operação.",
        variant: "destructive",
      });
      return;
    }

    if (!canPerformOperation(operation)) {
      toast({
        title: "Operação não permitida",
        description: "Alguns pedidos selecionados não são elegíveis para esta operação.",
        variant: "destructive",
      });
      return;
    }

    try {
      const service = OrdersBulkService.getInstance();
      const operationId = await service.startBulkOperation(
        operation,
        selectedOrders,
        additionalParams
      );

      // Start polling for operation status
      const interval = setInterval(async () => {
        try {
          const status = await service.getBulkOperationStatus(operationId);
          setCurrentOperation(status);

          if (status.status === 'completed') {
            clearInterval(interval);
            toast({
              title: "Operação concluída",
              description: `${status.processed_items} pedidos processados com sucesso.`,
            });
            clearSelection();
            onSuccess?.(status);
          } else if (status.status === 'failed') {
            clearInterval(interval);
            toast({
              title: "Operação falhou",
              description: status.error_message || "Erro desconhecido durante a operação.",
              variant: "destructive",
            });
            onError?.(new Error(status.error_message || 'Bulk operation failed'));
          }
        } catch (error) {
          clearInterval(interval);
          console.error('Error polling operation status:', error);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: any) {
      console.error('Bulk operation error:', error);
      toast({
        title: "Erro na operação",
        description: error.message || "Não foi possível executar a operação em lote.",
        variant: "destructive",
      });
      onError?.(error);
    }
  }, [selectedOrders, canPerformOperation, clearSelection, onSuccess, onError, toast]);

  const bulkUpdateStatus = useCallback(async (status: string) => {
    await executeOperation('update_status', { new_status: status });
  }, [executeOperation]);

  const bulkLowStock = useCallback(async () => {
    await executeOperation('baixar_estoque');
  }, [executeOperation]);

  const bulkCancelOrders = useCallback(async () => {
    await executeOperation('cancelar_pedidos');
  }, [executeOperation]);

  const bulkExport = useCallback(async (format: 'csv' | 'xlsx' | 'pdf') => {
    await executeOperation('export_data', { export_format: format });
  }, [executeOperation]);

  return {
    // Selection state
    selectedOrders,
    eligibleOrders,
    isAllSelected,
    hasSomeSelected,
    
    // Selection actions
    selectOrder,
    unselectOrder,
    selectAll,
    clearSelection,
    toggleOrder,
    
    // Bulk operations
    bulkUpdateStatus,
    bulkLowStock,
    bulkCancelOrders,
    bulkExport,
    
    // Operation state
    currentOperation,
    isProcessing,
    progress,
    
    // Validation
    getEligibilityReasons,
    canPerformOperation,
  };
}