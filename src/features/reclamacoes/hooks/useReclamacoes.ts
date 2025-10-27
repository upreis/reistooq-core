/**
 * 🎣 HOOK PRINCIPAL DE RECLAMAÇÕES
 * FASE 4.4: Suporte para paginação
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClaimFilters {
  periodo: string;
  status?: string;
  type?: string;
  stage?: string;
  has_messages?: string;
  has_evidences?: string;
  date_from?: string;
  date_to?: string;
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export function useReclamacoes(filters: ClaimFilters) {
  const [reclamacoes, setReclamacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0,
    totalPages: 1
  });
  const { toast } = useToast();

  // Buscar primeira conta ML disponível
  useEffect(() => {
    const fetchAccount = async () => {
      const { data: accounts } = await supabase
        .from('integration_accounts')
        .select('id')
        .eq('provider', 'mercadolivre')
        .eq('is_active', true)
        .limit(1);
      
      if (accounts && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
    };
    fetchAccount();
  }, []);

  const fetchReclamacoes = async (showLoading = true) => {
    if (!selectedAccountId) {
      setReclamacoes([]);
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Calcular data inicial baseada no período
      const calcularDataInicio = (periodo: string) => {
        const hoje = new Date();
        const dias = parseInt(periodo);
        hoje.setDate(hoje.getDate() - dias);
        return hoje.toISOString();
      };

      // Determinar datas para busca
      let dataInicio: string;
      let dataFim: string;

      if (filters.periodo === 'custom') {
        dataInicio = filters.date_from || calcularDataInicio('7');
        dataFim = filters.date_to || new Date().toISOString();
      } else {
        dataInicio = calcularDataInicio(filters.periodo);
        dataFim = new Date().toISOString();
      }

      // Calcular offset para paginação
      const offset = (pagination.currentPage - 1) * pagination.itemsPerPage;

      // Tentar buscar do banco primeiro (cache) com paginação
      let query = supabase
        .from('reclamacoes')
        .select('*', { count: 'exact' })
        .eq('integration_account_id', selectedAccountId)
        .gte('date_created', dataInicio)
        .lte('date_created', dataFim)
        .order('date_created', { ascending: false })
        .range(offset, offset + pagination.itemsPerPage - 1);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.has_messages === 'true') {
        query = query.eq('tem_mensagens', true);
      } else if (filters.has_messages === 'false') {
        query = query.eq('tem_mensagens', false);
      }
      if (filters.has_evidences === 'true') {
        query = query.eq('tem_evidencias', true);
      } else if (filters.has_evidences === 'false') {
        query = query.eq('tem_evidencias', false);
      }

      const { data: cached, error: dbError, count } = await query;

      if (!dbError && cached) {
        setReclamacoes(cached);
        if (count !== null) {
          setPagination(prev => ({
            ...prev,
            totalItems: count,
            totalPages: Math.ceil(count / prev.itemsPerPage)
          }));
        }
      }

      // Buscar da API ML para atualizar
      const { data, error: functionError } = await supabase.functions.invoke('ml-claims-fetch', {
        body: {
          accountId: selectedAccountId,
          filters: {
            status: filters.status,
            type: filters.type,
            date_from: dataInicio,
            date_to: dataFim
          },
          limit: pagination.itemsPerPage,
          offset: offset
        }
      });

      if (functionError) throw functionError;

      if (data?.claims) {
        // Aplicar filtros locais adicionais
        let filteredClaims = data.claims;

        if (filters.stage) {
          filteredClaims = filteredClaims.filter((c: any) => c.stage === filters.stage);
        }
        if (filters.has_messages === 'true') {
          filteredClaims = filteredClaims.filter((c: any) => c.tem_mensagens === true);
        } else if (filters.has_messages === 'false') {
          filteredClaims = filteredClaims.filter((c: any) => c.tem_mensagens === false);
        }
        if (filters.has_evidences === 'true') {
          filteredClaims = filteredClaims.filter((c: any) => c.tem_evidencias === true);
        } else if (filters.has_evidences === 'false') {
          filteredClaims = filteredClaims.filter((c: any) => c.tem_evidencias === false);
        }

        setReclamacoes(filteredClaims);
      }

    } catch (err: any) {
      console.error('[useReclamacoes] Erro:', err);
      setError(err.message || 'Erro ao buscar reclamações');
      toast({
        variant: 'destructive',
        title: 'Erro ao buscar reclamações',
        description: err.message || 'Tente novamente'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      fetchReclamacoes();
    }
  }, [
    selectedAccountId, 
    filters.periodo, 
    filters.status, 
    filters.type,
    filters.stage,
    filters.has_messages,
    filters.has_evidences,
    filters.date_from,
    filters.date_to,
    pagination.currentPage,
    pagination.itemsPerPage
  ]);

  const goToPage = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  };

  const changeItemsPerPage = (items: number) => {
    setPagination(prev => ({
      ...prev,
      itemsPerPage: items,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalItems / items)
    }));
  };

  return {
    reclamacoes,
    isLoading,
    isRefreshing,
    error,
    pagination,
    goToPage,
    changeItemsPerPage,
    refresh: () => fetchReclamacoes(false)
  };
}
