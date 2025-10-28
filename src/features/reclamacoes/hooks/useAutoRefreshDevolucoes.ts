import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DevolucaoComAnalise, STATUS_ATIVOS, STATUS_HISTORICO } from "../types/devolucao-analise.types";

interface UseAutoRefreshDevolucoesProps {
  accountIds: string[];
  autoRefreshEnabled?: boolean;
  refreshIntervalMs?: number;
}

interface UseAutoRefreshDevolucoesReturn {
  // Dados
  devolucoesAtivas: DevolucaoComAnalise[];
  devolucoesHistorico: DevolucaoComAnalise[];
  
  // Estados
  isLoadingAtivas: boolean;
  isLoadingHistorico: boolean;
  errorAtivas: Error | null;
  errorHistorico: Error | null;
  
  // Ações
  refetchAtivas: () => void;
  refetchHistorico: () => void;
  refetchAll: () => void;
}

/**
 * Hook otimizado para buscar devoluções com auto-refresh
 * Usa React Query para cache inteligente e evita O(n²)
 */
export function useAutoRefreshDevolucoes({
  accountIds,
  autoRefreshEnabled = false,
  refreshIntervalMs = 30000 // 30 segundos
}: UseAutoRefreshDevolucoesProps): UseAutoRefreshDevolucoesReturn {
  
  // Query para devoluções ATIVAS
  const {
    data: devolucoesAtivas = [],
    isLoading: isLoadingAtivas,
    error: errorAtivas,
    refetch: refetchAtivas
  } = useQuery({
    queryKey: ['devolucoes-ativas', accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .in('integration_account_id', accountIds)
        .in('status_analise', STATUS_ATIVOS)
        .order('ultima_atualizacao_real', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as DevolucaoComAnalise[];
    },
    enabled: accountIds.length > 0,
    refetchInterval: autoRefreshEnabled ? refreshIntervalMs : false,
    staleTime: 10000, // Considera dados frescos por 10s
    gcTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Query para devoluções HISTÓRICAS
  const {
    data: devolucoesHistorico = [],
    isLoading: isLoadingHistorico,
    error: errorHistorico,
    refetch: refetchHistorico
  } = useQuery({
    queryKey: ['devolucoes-historico', accountIds],
    queryFn: async () => {
      if (accountIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('devolucoes_avancadas')
        .select('*')
        .in('integration_account_id', accountIds)
        .in('status_analise', STATUS_HISTORICO)
        .order('data_status_analise', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(200); // Limitar histórico para performance
      
      if (error) throw error;
      return (data || []) as unknown as DevolucaoComAnalise[];
    },
    enabled: accountIds.length > 0,
    staleTime: 60000, // Histórico não muda tanto, 60s
    gcTime: 10 * 60 * 1000, // Cache por 10 minutos
  });

  // Função para refetch de ambas as queries
  const refetchAll = () => {
    refetchAtivas();
    refetchHistorico();
  };

  return {
    // Dados
    devolucoesAtivas,
    devolucoesHistorico,
    
    // Estados
    isLoadingAtivas,
    isLoadingHistorico,
    errorAtivas: errorAtivas as Error | null,
    errorHistorico: errorHistorico as Error | null,
    
    // Ações
    refetchAtivas,
    refetchHistorico,
    refetchAll
  };
}
