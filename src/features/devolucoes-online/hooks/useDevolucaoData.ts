/**
 * 🪝 HOOK - DEVOLUÇÕES DATA
 * Hook para buscar dados de devoluções usando SWR
 */

import useSWR from 'swr';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDevolucaoStore } from '../store/useDevolucaoStore';
import { MLReturn } from '../types/devolucao.types';

interface FetchDevolucaoParams {
  accountIds: string[];
  filters: {
    search?: string;
    status?: string[];
    dateFrom?: string | null;
    dateTo?: string | null;
  };
  pagination: {
    offset: number;
    limit: number;
  };
}

interface DevolucaoResponse {
  returns: MLReturn[];
  total: number;
}

const fetchDevolucoes = async (params: FetchDevolucaoParams): Promise<DevolucaoResponse> => {
  const { data, error } = await supabase.functions.invoke('ml-returns', {
    body: params,
  });

  if (error) {
    console.error('❌ Erro ao buscar devoluções:', error);
    throw new Error(error.message || 'Erro ao buscar devoluções');
  }

  return data;
};

export const useDevolucaoData = () => {
  const filters = useDevolucaoStore(state => state.filters);
  const pagination = useDevolucaoStore(state => state.pagination);
  const setDevolucoes = useDevolucaoStore(state => state.setDevolucoes);
  const setPagination = useDevolucaoStore(state => state.setPagination);
  const setLoading = useDevolucaoStore(state => state.setLoading);
  const setError = useDevolucaoStore(state => state.setError);

  // Construir key para SWR
  const accountId = filters.integrationAccountId;
  const offset = (pagination.currentPage - 1) * pagination.itemsPerPage;

  const swrKey = accountId
    ? ['devolucoes', accountId, filters, pagination.currentPage]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () =>
      fetchDevolucoes({
        accountIds: [accountId],
        filters: {
          search: filters.search || undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
        pagination: {
          offset,
          limit: pagination.itemsPerPage,
        },
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 segundos
    }
  );

  // Atualizar store quando dados mudarem
  useEffect(() => {
    if (data) {
      console.log('📦 Devoluções recebidas:', data.returns?.length || 0, 'Total:', data.total);
      setDevolucoes(data.returns);
      setPagination({ total: data.total });
      setError(null);
    }
  }, [data, setDevolucoes, setPagination, setError]);

  // Atualizar loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Atualizar erro
  useEffect(() => {
    if (error) {
      setError(error.message);
    }
  }, [error, setError]);

  return {
    data,
    isLoading,
    error,
    refresh: mutate,
  };
};
