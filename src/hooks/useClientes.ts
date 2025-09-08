import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Cliente, ClientesFilters, ClientesStats } from '@/types/cliente';

export const useClientes = (filters: ClientesFilters = {}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .order('data_ultimo_pedido', { ascending: false, nullsFirst: false });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`nome_completo.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'todos') {
        query = query.eq('status_cliente', filters.status);
      }

      if (filters.cidade) {
        query = query.ilike('endereco_cidade', `%${filters.cidade}%`);
      }

      if (filters.uf) {
        query = query.eq('endereco_uf', filters.uf);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setClientes((data || []) as Cliente[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [filters.search, filters.status, filters.cidade, filters.uf]);

  const refetch = () => {
    fetchClientes();
  };

  return {
    clientes,
    loading,
    error,
    totalCount,
    refetch
  };
};

export const useClientesStats = () => {
  const [stats, setStats] = useState<ClientesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('clientes')
        .select('status_cliente, total_pedidos, valor_total_gasto, ticket_medio');

      if (queryError) throw queryError;

      const total = data?.length || 0;
      const ativos = data?.filter(c => c.total_pedidos > 0).length || 0;
      const vip = data?.filter(c => c.status_cliente === 'VIP').length || 0;
      const premium = data?.filter(c => c.status_cliente === 'Premium').length || 0;
      
      const ticket_medio = data?.length > 0 
        ? data.reduce((sum, c) => sum + (c.ticket_medio || 0), 0) / data.length
        : 0;
      
      const ltv_medio = data?.length > 0
        ? data.reduce((sum, c) => sum + (c.valor_total_gasto || 0), 0) / data.length
        : 0;

      setStats({
        total,
        ativos,
        vip,
        premium,
        ticket_medio,
        ltv_medio
      });
    } catch (err) {
      console.error('Erro ao buscar estatísticas de clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

// Hook para sincronizar clientes automaticamente dos pedidos
export const useSyncClientesFromPedidos = () => {
  const [syncing, setSyncing] = useState(false);

  const syncClientes = async () => {
    try {
      setSyncing(true);

      // Buscar pedidos únicos por cliente
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('nome_cliente, cpf_cnpj, cidade, uf, empresa, integration_account_id, data_pedido, valor_total')
        .not('nome_cliente', 'is', null);

      if (error) throw error;

      if (!pedidos?.length) {
        console.log('Nenhum pedido encontrado para sincronizar');
        return;
      }

      // Agrupar pedidos por cliente
      const clientesMap = new Map<string, any>();
      
      pedidos.forEach(pedido => {
        const key = pedido.cpf_cnpj || pedido.nome_cliente;
        
        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            nome_cliente: pedido.nome_cliente,
            cpf_cnpj: pedido.cpf_cnpj,
            cidade: pedido.cidade,
            uf: pedido.uf,
            empresa: pedido.empresa,
            integration_account_id: pedido.integration_account_id,
            pedidos: []
          });
        }
        
        clientesMap.get(key).pedidos.push({
          data_pedido: pedido.data_pedido,
          valor_total: pedido.valor_total || 0
        });
      });

      // Sincronizar cada cliente
      for (const [_, clienteData] of clientesMap) {
        const pedidosCliente = clienteData.pedidos;
        const valorTotal = pedidosCliente.reduce((sum: number, p: any) => sum + p.valor_total, 0);
        const ticketMedio = valorTotal / pedidosCliente.length;
        
        // Usar RPC para sincronizar
        await supabase.rpc('sync_cliente_from_pedido', {
          p_nome_cliente: clienteData.nome_cliente,
          p_cpf_cnpj: clienteData.cpf_cnpj,
          p_cidade: clienteData.cidade,
          p_uf: clienteData.uf,
          p_empresa: clienteData.empresa,
          p_integration_account_id: clienteData.integration_account_id,
          p_data_pedido: pedidosCliente[0].data_pedido,
          p_valor_pedido: ticketMedio
        });
      }

      console.log(`Sincronizados ${clientesMap.size} clientes`);
    } catch (err) {
      console.error('Erro ao sincronizar clientes:', err);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncClientes,
    syncing
  };
};