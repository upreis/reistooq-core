import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DevolucoesFiltros {
  status: 'todas' | 'opened' | 'closed';
  periodo: string;
  search: string;
  page: number;
  limit: number;
}

export function useDevolucoesSincronizadas() {
  const [filtros, setFiltros] = useState<DevolucoesFiltros>({
    status: 'opened',
    periodo: '60',
    search: '',
    page: 1,
    limit: 25
  });

  // Buscar devoluções do Supabase (não da API ML)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devolucoes-supabase', filtros],
    queryFn: async () => {
      let query = supabase
        .from('devolucoes_avancadas')
        .select('*', { count: 'exact' });

      // Filtro por status
      if (filtros.status !== 'todas') {
        query = query.eq('status_devolucao', filtros.status);
      }

      // Filtro por período
      if (filtros.periodo !== 'todas') {
        const diasAtras = parseInt(filtros.periodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasAtras);
        query = query.gte('data_criacao', dataLimite.toISOString());
      }

      // Filtro de busca
      if (filtros.search) {
        query = query.or(`produto_titulo.ilike.%${filtros.search}%,order_id.ilike.%${filtros.search}%,claim_id.ilike.%${filtros.search}%`);
      }

      // Paginação
      const offset = (filtros.page - 1) * filtros.limit;
      query = query
        .order('data_criacao', { ascending: false })
        .range(offset, offset + filtros.limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        devolucoes: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filtros.limit)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: 5 * 60 * 1000 // 5 minutos
  });

  // Sincronização manual
  const sincronizarAgora = async () => {
    try {
      toast.info('🔄 Iniciando sincronização...');
      
      const { data: syncResult, error } = await supabase.functions.invoke('sync-devolucoes-ml');
      
      if (error) throw error;
      
      toast.success(`✅ Sincronização concluída! ${syncResult?.stats?.total_claims_processados || 0} devoluções processadas`);
      await refetch();
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro na sincronização: ' + ((error as any)?.message || 'Erro desconhecido'));
    }
  };

  return {
    devolucoes: data?.devolucoes || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    loading: isLoading,
    error,
    filtros,
    setFiltros,
    sincronizarAgora,
    refetch
  };
}
