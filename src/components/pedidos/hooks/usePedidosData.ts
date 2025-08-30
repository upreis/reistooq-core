import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapeamentoService, MapeamentoVerificacao } from '@/services/MapeamentoService';
import { usePedidosProcessados } from '@/hooks/usePedidosProcessados';

export function usePedidosData() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());
  const [showBaixaModal, setShowBaixaModal] = useState(false);

  const { pedidosProcessados, verificarPedidos, isLoading: loadingProcessados, isPedidoProcessado } = usePedidosProcessados();

  // Carrega contas de integração
  const loadAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('platform', 'mercadolivre')
        .eq('status', 'active');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  }, []);

  // Carrega dados de mapeamento
  const loadMappingData = useCallback(async (orders: any[]) => {
    if (!orders.length) return new Map();

    try {
      const mappings = new Map<string, MapeamentoVerificacao>();
      const batchSize = 50;
      
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        const promises = batch.map(async (order) => {
          try {
            const verificacao = await MapeamentoService.verificarMapeamentoCompleto(order);
            return { orderId: order.id, verificacao };
          } catch (error) {
            console.error(`Erro ao verificar mapeamento do pedido ${order.id}:`, error);
            return null;
          }
        });

        const results = await Promise.all(promises);
        results.forEach(result => {
          if (result) {
            mappings.set(result.orderId, result.verificacao);
          }
        });
      }

      setMappingData(mappings);
      return mappings;
    } catch (error) {
      console.error('Erro ao carregar dados de mapeamento:', error);
      return new Map();
    }
  }, []);

  // Funções de seleção otimizadas
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  const selectAllOrders = useCallback((orders: any[]) => {
    setSelectedOrders(new Set(orders.map(order => order.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrders(new Set());
  }, []);

  // Dados memoizados
  const selectedOrdersArray = useMemo(() => {
    return Array.from(selectedOrders);
  }, [selectedOrders]);

  return {
    // Estado
    accounts,
    selectedOrders,
    selectedOrdersArray,
    mappingData,
    showBaixaModal,
    loadingProcessados,
    pedidosProcessados,
    
    // Ações
    setAccounts,
    setSelectedOrders,
    setMappingData,
    setShowBaixaModal,
    loadAccounts,
    loadMappingData,
    toggleOrderSelection,
    selectAllOrders,
    clearSelection,
    verificarPedidos,
    isPedidoProcessado
  };
}