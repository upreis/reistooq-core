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

export function useReclamacoes(filters: ClaimFilters, selectedAccountIds: string[], shouldFetch: boolean = true) {
  const [reclamacoes, setReclamacoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 50,
    totalItems: 0,
    totalPages: 1
  });
  const { toast } = useToast();

  const fetchReclamacoes = async (showLoading = true) => {
    if (!selectedAccountIds || selectedAccountIds.length === 0) {
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

      // ✅ Calcular período em dias para API
      const calcularPeriodoDias = (periodo: string): number => {
        if (periodo === 'custom') return 0; // 0 = usar date_from/date_to
        return parseInt(periodo) || 0;
      };

      const periodoDias = calcularPeriodoDias(filters.periodo);

      // ✅ Buscar seller_id das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        console.error('[useReclamacoes] Erro ao buscar dados das contas:', accountsError);
        throw new Error('Não foi possível obter informações das contas do Mercado Livre');
      }

      // ✅ Buscar TODAS as claims de TODAS as contas JUNTAS (sem paginação individual)
      const allClaimsPromises = accountsData.map(async (account) => {
        if (!account.account_identifier) {
          console.warn(`[useReclamacoes] Conta ${account.id} sem account_identifier`);
          return [];
        }

        const { data, error } = await supabase.functions.invoke('ml-api-direct', {
          body: {
            action: 'get_claims_and_returns',
            integration_account_id: account.id,
            seller_id: account.account_identifier,
            limit: 1000, // ✅ Buscar máximo possível de cada conta
            offset: 0,
            filters: {
              periodoDias,
              claim_type: filters.type || '',
              stage: filters.stage || ''
            }
          }
        });

        if (error) {
          console.error('[useReclamacoes] Erro na conta', account.id, error);
          return [];
        }

        return data?.data || [];
      });

      const allClaimsArrays = await Promise.all(allClaimsPromises);
      const allClaims = allClaimsArrays.flat();

      console.log(`[useReclamacoes] Total de claims encontradas: ${allClaims.length}`);

      if (allClaims.length === 0) {
        setReclamacoes([]);
        setPagination(prev => ({
          ...prev,
          totalItems: 0,
          totalPages: 1
        }));
        return;
      }

      // ✅ Processar mensagens (usando mapper igual /ml-orders-completas)
      const claimsWithMessages = allClaims.map((item: any) => {
        const rawMessages = item.claim_messages?.messages || [];
        
        // Deduplicação por hash
        const uniqueMessages = rawMessages.reduce((acc: any[], msg: any) => {
          const msgDate = msg.date_created || msg.message_date?.created || '';
          const messageHash = msg.hash || `${msg.sender_role}_${msg.receiver_role}_${msgDate}_${msg.message}`;
          
          const isDuplicate = acc.some(existingMsg => {
            const existingDate = existingMsg.date_created || existingMsg.message_date?.created || '';
            const existingHash = existingMsg.hash || `${existingMsg.sender_role}_${existingMsg.receiver_role}_${existingDate}_${existingMsg.message}`;
            return existingHash === messageHash;
          });
          
          if (!isDuplicate) acc.push(msg);
          return acc;
        }, []);
        
        // Ordenar por data (mais recente primeiro)
        const sortedMessages = uniqueMessages.sort((a, b) => {
          const dateA = new Date(a.date_created || a.message_date?.created || 0).getTime();
          const dateB = new Date(b.date_created || b.message_date?.created || 0).getTime();
          return dateB - dateA;
        });
        
        const lastMessage = sortedMessages[0] || null;
        
        return {
          ...item,
          timeline_mensagens: sortedMessages,
          ultima_mensagem_data: lastMessage?.date_created || lastMessage?.message_date?.created || null,
          ultima_mensagem_remetente: lastMessage?.sender_role || null,
          mensagens_nao_lidas: item.claim_messages?.unread_messages || 0
        };
      });

      // ✅ Aplicar filtros locais DEPOIS de processar
      let filteredClaims = claimsWithMessages;

      if (filters.status) {
        filteredClaims = filteredClaims.filter(c => c.status === filters.status);
      }
      if (filters.has_messages === 'true') {
        filteredClaims = filteredClaims.filter(c => c.timeline_mensagens?.length > 0);
      } else if (filters.has_messages === 'false') {
        filteredClaims = filteredClaims.filter(c => !c.timeline_mensagens || c.timeline_mensagens.length === 0);
      }
      if (filters.has_evidences === 'true') {
        filteredClaims = filteredClaims.filter(c => c.tem_evidencias === true);
      } else if (filters.has_evidences === 'false') {
        filteredClaims = filteredClaims.filter(c => c.tem_evidencias === false);
      }

      // ✅ Atualizar paginação com total REAL
      const totalItems = filteredClaims.length;
      setPagination(prev => ({
        ...prev,
        totalItems,
        totalPages: Math.ceil(totalItems / prev.itemsPerPage)
      }));

      // ✅ Aplicar paginação CLIENT-SIDE (após filtros)
      const startIndex = offset;
      const endIndex = offset + pagination.itemsPerPage;
      const paginatedClaims = filteredClaims.slice(startIndex, endIndex);

      setReclamacoes(paginatedClaims);

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

  // Recarregar quando filtros mudarem (mas só se shouldFetch for true)
  useEffect(() => {
    if (shouldFetch && selectedAccountIds && selectedAccountIds.length > 0) {
      fetchReclamacoes();
    }
  }, [
    shouldFetch,
    selectedAccountIds.join(','), // Usar join para detectar mudanças no array
    filters.periodo, 
    filters.status, 
    filters.type,
    filters.stage,
    filters.has_messages,
    filters.has_evidences,
    filters.date_from,
    filters.date_to
    // NÃO incluir pagination aqui para evitar loop infinito
  ]);

  // Recarregar quando página/items per page mudarem (via ações do usuário)
  useEffect(() => {
    if (shouldFetch && selectedAccountIds && selectedAccountIds.length > 0 && !isLoading) {
      fetchReclamacoes(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, pagination.totalPages));
    if (newPage !== pagination.currentPage) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
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
