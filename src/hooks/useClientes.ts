import { useState, useEffect } from 'react';
import type { Cliente, ClientesFilters, ClientesStats } from '@/types/cliente';
import { SecureClienteService } from '@/services/SecureClienteService';

export const useClientes = (filters: ClientesFilters = {}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError, count } = await SecureClienteService.getClientes(filters);

      if (queryError) throw queryError;

      setClientes(data || []);
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

      const { data: stats, error: queryError } = await SecureClienteService.getClientesStats();

      if (queryError) throw queryError;

      setStats(stats);
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
      const { data, error } = await SecureClienteService.syncClientesFromPedidos();
      
      if (error) throw error;
      
      console.log('Clientes sincronizados com sucesso');
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