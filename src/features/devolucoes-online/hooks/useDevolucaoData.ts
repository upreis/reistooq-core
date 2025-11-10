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

  // ✅ FASE 4: Parsear TODOS os campos JSONB enriquecidos
  if (data?.returns && Array.isArray(data.returns)) {
    data.returns = data.returns.map((devolucao: any) => {
      // Parsear dados_review (review_info)
      if (devolucao.dados_review && typeof devolucao.dados_review === 'string') {
        try {
          devolucao.review_info = JSON.parse(devolucao.dados_review);
        } catch (e) {
          console.warn('❌ Erro ao parsear review_info:', e);
        }
      } else if (devolucao.dados_review && typeof devolucao.dados_review === 'object') {
        devolucao.review_info = devolucao.dados_review;
      }
      
      // Parsear dados_comunicacao (communication_info)
      if (devolucao.dados_comunicacao && typeof devolucao.dados_comunicacao === 'string') {
        try {
          devolucao.communication_info = JSON.parse(devolucao.dados_comunicacao);
        } catch (e) {
          console.warn('❌ Erro ao parsear communication_info:', e);
        }
      } else if (devolucao.dados_comunicacao && typeof devolucao.dados_comunicacao === 'object') {
        devolucao.communication_info = devolucao.dados_comunicacao;
      }
      
      // Parsear dados_deadlines
      if (devolucao.dados_deadlines && typeof devolucao.dados_deadlines === 'string') {
        try {
          devolucao.deadlines = JSON.parse(devolucao.dados_deadlines);
        } catch (e) {
          console.warn('❌ Erro ao parsear deadlines:', e);
        }
      } else if (devolucao.dados_deadlines && typeof devolucao.dados_deadlines === 'object') {
        devolucao.deadlines = devolucao.dados_deadlines;
      }
      
      // Parsear dados_lead_time
      if (devolucao.dados_lead_time && typeof devolucao.dados_lead_time === 'string') {
        try {
          devolucao.lead_time = JSON.parse(devolucao.dados_lead_time);
        } catch (e) {
          console.warn('❌ Erro ao parsear lead_time:', e);
        }
      } else if (devolucao.dados_lead_time && typeof devolucao.dados_lead_time === 'object') {
        devolucao.lead_time = devolucao.dados_lead_time;
      }
      
      // Parsear dados_acoes_disponiveis (available_actions)
      if (devolucao.dados_acoes_disponiveis && typeof devolucao.dados_acoes_disponiveis === 'string') {
        try {
          devolucao.available_actions = JSON.parse(devolucao.dados_acoes_disponiveis);
        } catch (e) {
          console.warn('❌ Erro ao parsear available_actions:', e);
        }
      } else if (devolucao.dados_acoes_disponiveis && typeof devolucao.dados_acoes_disponiveis === 'object') {
        devolucao.available_actions = devolucao.dados_acoes_disponiveis;
      }
      
      // Parsear dados_custos_logistica (shipping_costs)
      if (devolucao.dados_custos_logistica && typeof devolucao.dados_custos_logistica === 'string') {
        try {
          devolucao.shipping_costs = JSON.parse(devolucao.dados_custos_logistica);
        } catch (e) {
          console.warn('❌ Erro ao parsear shipping_costs:', e);
        }
      } else if (devolucao.dados_custos_logistica && typeof devolucao.dados_custos_logistica === 'object') {
        devolucao.shipping_costs = devolucao.dados_custos_logistica;
      }
      
      // Parsear dados_fulfillment (fulfillment_info)
      if (devolucao.dados_fulfillment && typeof devolucao.dados_fulfillment === 'string') {
        try {
          devolucao.fulfillment_info = JSON.parse(devolucao.dados_fulfillment);
        } catch (e) {
          console.warn('❌ Erro ao parsear fulfillment_info:', e);
        }
      } else if (devolucao.dados_fulfillment && typeof devolucao.dados_fulfillment === 'object') {
        devolucao.fulfillment_info = devolucao.dados_fulfillment;
      }
      
      // Parsear dados_available_actions (redundância, caso exista)
      if (devolucao.dados_available_actions && typeof devolucao.dados_available_actions === 'string') {
        try {
          if (!devolucao.available_actions) {
            devolucao.available_actions = JSON.parse(devolucao.dados_available_actions);
          }
        } catch (e) {
          console.warn('❌ Erro ao parsear dados_available_actions:', e);
        }
      }
      
      // Parsear dados_shipping_costs (redundância, caso exista)
      if (devolucao.dados_shipping_costs && typeof devolucao.dados_shipping_costs === 'string') {
        try {
          if (!devolucao.shipping_costs) {
            devolucao.shipping_costs = JSON.parse(devolucao.dados_shipping_costs);
          }
        } catch (e) {
          console.warn('❌ Erro ao parsear dados_shipping_costs:', e);
        }
      }
      
      return devolucao;
    });
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
    () => {
      const formatDate = (date: Date | string | null) => {
        if (!date) return undefined;
        if (date instanceof Date) return date.toISOString().split('T')[0];
        return date;
      };
      
      return fetchDevolucoes({
        accountIds: [accountId],
        filters: {
          search: filters.search || undefined,
          status: filters.status.length > 0 ? filters.status : undefined,
          dateFrom: formatDate(filters.dateFrom),
          dateTo: formatDate(filters.dateTo),
        },
        pagination: {
          offset,
          limit: pagination.itemsPerPage,
        },
      });
    },
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
