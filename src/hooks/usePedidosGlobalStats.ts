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

      try {
        // Query otimizada: buscar apenas campos essenciais com limite de 60 dias
        const sessantaDiasAtras = new Date(hoje.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const { data: orders, error: totalsError } = await supabase
          .from('ml_orders')
          .select('status, total_amount, paid_amount, date_created, last_synced_at')
          .in('integration_account_id', accountIds)
          .gte('date_created', sessantaDiasAtras.toISOString())
          .order('date_created', { ascending: false });

        if (totalsError) {
          console.error('❌ [PedidosGlobalStats] Erro ao buscar totais:', totalsError);
          throw totalsError;
        }

        const data = orders || [];
        
        // Calcular estatísticas de forma eficiente (single pass)
        let totalPedidos = 0;
        let totalValor = 0;
        let totalPago = 0;
        let pending = 0;
        let paid = 0;
        let cancelled = 0;
        let hoje_count = 0;
        let ultimos7Dias = 0;
        let ultimos30Dias = 0;
        let valorHoje = 0;
        let valorUltimos7Dias = 0;
        let valorUltimos30Dias = 0;
        let ultimaSincronizacao: string | null = null;

        for (const o of data) {
          totalPedidos++;
          const amount = Number(o.total_amount) || 0;
          const paidAmount = Number(o.paid_amount) || 0;
          totalValor += amount;
          totalPago += paidAmount;

          // Status
          if (o.status === 'pending') pending++;
          else if (o.status === 'paid') paid++;
          else if (o.status === 'cancelled') cancelled++;

          // Períodos
          if (o.date_created) {
            const orderDate = new Date(o.date_created);
            if (orderDate >= hoje) {
              hoje_count++;
              valorHoje += amount;
            }
            if (orderDate >= seteDiasAtras) {
              ultimos7Dias++;
              valorUltimos7Dias += amount;
            }
            if (orderDate >= trintaDiasAtras) {
              ultimos30Dias++;
              valorUltimos30Dias += amount;
            }
          }

          // Última sincronização
          if (o.last_synced_at) {
            if (!ultimaSincronizacao || new Date(o.last_synced_at) > new Date(ultimaSincronizacao)) {
              ultimaSincronizacao = o.last_synced_at;
            }
          }
        }

        const stats: PedidosGlobalStats = {
          totalPedidos,
          totalValor,
          totalPago,
          pending,
          paid,
          cancelled,
          hoje: hoje_count,
          ultimos7Dias,
          ultimos30Dias,
          valorHoje,
          valorUltimos7Dias,
          valorUltimos30Dias,
          ultimaSincronizacao,
          contasSincronizadas: data.length > 0 ? accountIds.length : 0
        };

        console.log('📊 [PedidosGlobalStats] Estatísticas calculadas:', {
          total: stats.totalPedidos,
          valor: stats.totalValor,
          ultimos7Dias: stats.ultimos7Dias
        });

        return stats;
      } catch (err) {
        console.error('❌ [PedidosGlobalStats] Erro na query:', err);
        throw err;
      }
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
