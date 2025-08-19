import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, BulkStockPayload } from '@/services/OrderService';
import { Order } from '../../types/Orders.types';
import { toast } from '@/hooks/use-toast';

interface UseOrdersMutationsReturn {
  // Bulk operations
  bulkStock: {
    mutate: (payload: BulkStockPayload) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  
  // Export operations
  exportCsv: {
    mutate: (params: any) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
}

export function useOrdersMutations(): UseOrdersMutationsReturn {
  const queryClient = useQueryClient();
  
  // Bulk stock operations with optimistic updates
  const bulkStockMutation = useMutation({
    mutationFn: (payload: BulkStockPayload) => orderService.bulkStock(payload),
    
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      
      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(['orders']);
      
      // Optimistically update orders
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (old: any) => {
          if (!old?.data) return old;
          
          return {
            ...old,
            data: old.data.map((order: Order) => {
              if (payload.orderIds.includes(order.id)) {
                // Update order based on action
                if (payload.action === 'baixar_estoque') {
                  return {
                    ...order,
                    obs_interna: `${order.obs_interna || ''} ESTOQUE_BAIXADO`.trim()
                  };
                } else if (payload.action === 'cancelar_pedido') {
                  return {
                    ...order,
                    situacao: 'Cancelado' as const
                  };
                }
              }
              return order;
            })
          };
        }
      );
      
      // Show optimistic feedback
      toast({
        title: "Processando...",
        description: `Processando ${payload.orderIds.length} pedido(s)...`,
      });
      
      return { previousOrders };
    },
    
    onError: (error, payload, context) => {
      // Revert optimistic updates
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      
      toast({
        title: "Erro no processamento",
        description: error.message || "Não foi possível processar os pedidos.",
        variant: "destructive"
      });
    },
    
    onSuccess: (data, payload) => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      
      const actionName = payload.action === 'baixar_estoque' ? 'baixa de estoque' : 'cancelamento';
      
      toast({
        title: "Processamento concluído",
        description: `${payload.orderIds.length} pedido(s) processado(s) com sucesso (${actionName}).`,
      });
    }
  });
  
  // Export CSV mutation
  const exportCsvMutation = useMutation({
    mutationFn: ({ filters, filename }: { filters: any; filename?: string }) =>
      orderService.exportCsv(filters, filename),
    
    onMutate: () => {
      toast({
        title: "Iniciando exportação...",
        description: "Preparando arquivo CSV para download.",
      });
    },
    
    onError: (error) => {
      toast({
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar os pedidos.",
        variant: "destructive"
      });
    },
    
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Exportação concluída",
          description: `Arquivo ${result.filename} foi baixado com sucesso.`,
        });
      } else {
        toast({
          title: "Erro na exportação",
          description: result.error || "Falha ao gerar arquivo CSV.",
          variant: "destructive"
        });
      }
    }
  });
  
  // Order update mutation (for future use)
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Order> }) => {
      // This would call an order update service
      throw new Error('Order update not implemented yet');
    },
    
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      await queryClient.cancelQueries({ queryKey: ['order', id] });
      
      const previousOrders = queryClient.getQueryData(['orders']);
      const previousOrder = queryClient.getQueryData(['order', id]);
      
      // Optimistic update for orders list
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((order: Order) =>
              order.id === id ? { ...order, ...updates } : order
            )
          };
        }
      );
      
      // Optimistic update for single order
      queryClient.setQueryData(['order', id], (old: Order | undefined) =>
        old ? { ...old, ...updates } : undefined
      );
      
      return { previousOrders, previousOrder };
    },
    
    onError: (error, { id }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', id], context.previousOrder);
      }
      
      toast({
        title: "Erro ao atualizar pedido",
        description: error.message,
        variant: "destructive"
      });
    },
    
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      
      toast({
        title: "Pedido atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    }
  });
  
  return {
    bulkStock: {
      mutate: bulkStockMutation.mutate,
      isPending: bulkStockMutation.isPending,
      isError: bulkStockMutation.isError,
      error: bulkStockMutation.error
    },
    exportCsv: {
      mutate: exportCsvMutation.mutate,
      isPending: exportCsvMutation.isPending,
      isError: exportCsvMutation.isError,
      error: exportCsvMutation.error
    }
  };
}