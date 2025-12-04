/**
 * 📊 HOOK DE ESTATÍSTICAS GLOBAIS - OPÇÃO A (HÍBRIDA)
 * 
 * Lê estatísticas de ml_orders (tabela sincronizada pelo CRON) para mostrar
 * totais GLOBAIS de TODAS as páginas sem afetar a busca atual.
 * 
 * SEGURANÇA: Este hook apenas LÊ dados de ml_orders.
 * A busca da tabela continua usando unified-orders normalmente.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo, useState, useEffect } from 'react';

interface PedidosGlobalStats {
  // Totais globais (últimos 60 dias)
  totalPedidos: number;
  totalValor: number;
  totalPago: number;
  
  // Por status
  pending: number;
  paid: number;
  cancelled: number;
  
  // Por período
  hoje: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  
  // Valores
  valorHoje: number;
  valorUltimos7Dias: number;
  valorUltimos30Dias: number;
  
  // Meta dados
  ultimaSincronizacao: string | null;
  contasSincronizadas: number;
}

interface UsePedidosGlobalStatsOptions {
  enabled?: boolean;
  selectedAccountIds?: string[];
  staleTime?: number;
}

// Hook interno para buscar contas ML ativas
function useMLAccountsInternal() {
  const [accounts, setAccounts] = useState<{id: string; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data, error } = await supabase
          .from('integration_accounts')
          .select('id, name')
          .eq('provider', 'mercadolivre')
          .eq('is_active', true);
        
        if (!error && data) {
          setAccounts(data);
        }
      } catch (err) {
        console.error('Erro ao buscar contas ML:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  return { accounts, isLoading };
}

export function usePedidosGlobalStats(options: UsePedidosGlobalStatsOptions = {}) {
  const {
    enabled = true,
    selectedAccountIds = [],
    staleTime = 2 * 60 * 1000 // 2 minutos
  } = options;

  const { accounts, isLoading: loadingAccounts } = useMLAccountsInternal();
  
  // Determinar quais contas usar
  const accountIds = useMemo(() => {
    if (selectedAccountIds.length > 0) return selectedAccountIds;
    return accounts?.map(a => a.id) || [];
  }, [selectedAccountIds, accounts]);

  const query = useQuery({
    queryKey: ['pedidos-global-stats', accountIds.slice().sort().join(',')],
    queryFn: async (): Promise<PedidosGlobalStats> => {
      if (accountIds.length === 0) {
        return getEmptyStats();
      }

      const now = new Date();
      const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Query 1: Totais globais
      const { data: totals, error: totalsError } = await supabase
        .from('ml_orders')
        .select('id, status, total_amount, paid_amount, date_created, last_synced_at')
        .in('integration_account_id', accountIds);

      if (totalsError) {
        console.error('❌ [PedidosGlobalStats] Erro ao buscar totais:', totalsError);
        throw totalsError;
      }

      const orders = totals || [];
      
      // Calcular estatísticas
      const stats: PedidosGlobalStats = {
        totalPedidos: orders.length,
        totalValor: orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        totalPago: orders.reduce((sum, o) => sum + (Number(o.paid_amount) || 0), 0),
        
        // Por status
        pending: orders.filter(o => o.status === 'pending').length,
        paid: orders.filter(o => o.status === 'paid').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
        
        // Por período
        hoje: orders.filter(o => o.date_created && new Date(o.date_created) >= hoje).length,
        ultimos7Dias: orders.filter(o => o.date_created && new Date(o.date_created) >= seteDiasAtras).length,
        ultimos30Dias: orders.filter(o => o.date_created && new Date(o.date_created) >= trintaDiasAtras).length,
        
        // Valores por período
        valorHoje: orders
          .filter(o => o.date_created && new Date(o.date_created) >= hoje)
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        valorUltimos7Dias: orders
          .filter(o => o.date_created && new Date(o.date_created) >= seteDiasAtras)
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        valorUltimos30Dias: orders
          .filter(o => o.date_created && new Date(o.date_created) >= trintaDiasAtras)
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
        
        // Meta dados
        ultimaSincronizacao: orders.length > 0 
          ? orders.reduce((latest, o) => {
              if (!o.last_synced_at) return latest;
              return !latest || new Date(o.last_synced_at) > new Date(latest) 
                ? o.last_synced_at 
                : latest;
            }, null as string | null)
          : null,
        contasSincronizadas: new Set(orders.map(o => o.id)).size > 0 
          ? accountIds.length 
          : 0
      };

      console.log('📊 [PedidosGlobalStats] Estatísticas calculadas:', {
        total: stats.totalPedidos,
        valor: stats.totalValor,
        ultimos7Dias: stats.ultimos7Dias
      });

      return stats;
    },
    enabled: enabled && !loadingAccounts && accountIds.length > 0,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    stats: query.data || getEmptyStats(),
    isLoading: query.isLoading || loadingAccounts,
    error: query.error,
    refetch: query.refetch,
    isFetched: query.isFetched
  };
}

function getEmptyStats(): PedidosGlobalStats {
  return {
    totalPedidos: 0,
    totalValor: 0,
    totalPago: 0,
    pending: 0,
    paid: 0,
    cancelled: 0,
    hoje: 0,
    ultimos7Dias: 0,
    ultimos30Dias: 0,
    valorHoje: 0,
    valorUltimos7Dias: 0,
    valorUltimos30Dias: 0,
    ultimaSincronizacao: null,
    contasSincronizadas: 0
  };
}
