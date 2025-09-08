import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchPedidosRealtime } from '@/services/orders';
import type { Row } from '@/services/orders';

interface FiltersState {
  dateRange: {
    from?: Date;
    to?: Date;
  };
  shippingStatus?: string;
  searchTerm?: string;
  account?: string;
}

interface PedidosState {
  pedidos: Row[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: FiltersState;
}

export function usePedidosManager() {
  const [state, setState] = useState<PedidosState>({
    pedidos: [],
    loading: false,
    error: null,
    total: 0,
    filters: {
      dateRange: {}
    }
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  // Carregar contas ativas
  const loadAccounts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('integration_accounts')
        .select('*')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      setAccounts(data || []);
      
      // Auto-selecionar se há apenas uma conta
      if (data?.length === 1) {
        setSelectedAccount(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  }, []);

  // Buscar pedidos via unified-orders
  const fetchPedidos = useCallback(async (accountId: string, filters: FiltersState) => {
    if (!accountId) return { pedidos: [], total: 0 };

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params: any = {
        integration_account_id: accountId,
        limit: 25,
        offset: 0,
        enrich: true,
        include_shipping: true
      };

      // Aplicar filtros
      if (filters.dateRange.from) {
        params.date_from = filters.dateRange.from.toISOString().split('T')[0];
      }
      if (filters.dateRange.to) {
        params.date_to = filters.dateRange.to.toISOString().split('T')[0];
      }
      if (filters.shippingStatus) {
        params.shipping_status = filters.shippingStatus;
      }
      if (filters.searchTerm) {
        params.q = filters.searchTerm;
      }

      console.log('📡 Buscando pedidos unified-orders:', params);

      const result = await fetchPedidosRealtime(params);
      
      setState(prev => ({
        ...prev,
        pedidos: result.rows,
        total: result.total,
        loading: false,
        error: null
      }));

      console.log(`✅ Pedidos carregados: ${result.rows.length}/${result.total}`);
      
      return { pedidos: result.rows, total: result.total };

    } catch (error: any) {
      console.error('❌ Erro ao buscar pedidos:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao buscar pedidos'
      }));
      return { pedidos: [], total: 0 };
    }
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: Partial<FiltersState>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  // Recarregar dados quando conta ou filtros mudam
  useEffect(() => {
    if (selectedAccount) {
      fetchPedidos(selectedAccount, state.filters);
    }
  }, [selectedAccount, state.filters, fetchPedidos]);

  // Carregar contas na inicialização
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Dados para estatísticas simples
  const stats = useMemo(() => {
    const pedidos = state.pedidos;
    return {
      total: pedidos.length,
      shipped: pedidos.filter(p => ['shipped', 'ready_to_ship'].includes(p.raw?.shipping?.status)).length,
      delivered: pedidos.filter(p => p.raw?.shipping?.status === 'delivered').length,
      baixados: 0 // Simplificado - pode ser calculado se necessário
    };
  }, [state.pedidos]);

  return {
    // Estado
    pedidos: state.pedidos,
    loading: state.loading,
    error: state.error,
    total: state.total,
    
    // Contas
    accounts,
    selectedAccount,
    setSelectedAccount,
    
    // Filtros
    filters: state.filters,
    applyFilters,
    
    // Estatísticas
    stats,
    
    // Ações
    refresh: () => selectedAccount && fetchPedidos(selectedAccount, state.filters),
    clearError: () => setState(prev => ({ ...prev, error: null }))
  };
}