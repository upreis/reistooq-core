import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePedidosData() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [mappingData, setMappingData] = useState<Map<string, any>>(new Map());
  const [showBaixaModal, setShowBaixaModal] = useState(false);

  // Carrega contas de integração
  const loadAccounts = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('integration_accounts')
        .select('id, name, platform, status' as any)
        .eq('platform', 'mercadolivre')
        .eq('status', 'active');

      if (error) throw error as any;
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      setAccounts([]);
    }
  }, []);

  // Carrega dados de mapeamento
  const loadMappingData = useCallback(async (orders: any[]) => {
    if (!orders.length) return new Map();

    try {
      const mappings = new Map<string, any>();
      // TODO: Implement mapping verification
      console.log('Loading mapping data for orders:', orders.length);
      
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
  };
}