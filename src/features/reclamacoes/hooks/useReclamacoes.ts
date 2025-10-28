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

      // Tentar buscar do banco primeiro (cache) com paginação E MENSAGENS
      let query = supabase
        .from('reclamacoes')
        .select(`
          *,
          timeline_mensagens:reclamacoes_mensagens(
            id,
            sender_id,
            sender_role,
            receiver_id,
            receiver_role,
            message,
            attachments,
            date_created,
            status
          )
        `, { count: 'exact' })
        .in('integration_account_id', selectedAccountIds)
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

      // Não usar cache vazio - esperar API
      if (dbError) {
        console.warn('[useReclamacoes] Erro no cache, ignorando:', dbError);
      }

      // Guardar count para paginação, mas NÃO mostrar dados ainda
      if (count !== null) {
        setPagination(prev => ({
          ...prev,
          totalItems: count,
          totalPages: Math.ceil(count / prev.itemsPerPage)
        }));
      }

      // Buscar seller_id das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        console.error('[useReclamacoes] Erro ao buscar dados das contas:', accountsError);
        throw new Error('Não foi possível obter informações das contas do Mercado Livre');
      }

      // Buscar da API ML para atualizar (buscar de todas as contas selecionadas)
      const allClaims: any[] = [];
      
      for (const account of accountsData) {
        if (!account.account_identifier) {
          console.warn(`[useReclamacoes] Conta ${account.id} sem account_identifier (seller_id)`);
          continue;
        }

        // ✅ CORREÇÃO: Usar ml-api-direct igual a página de devoluções
        const { data, error: functionError } = await supabase.functions.invoke('ml-api-direct', {
          body: {
            action: 'get_claims_and_returns',
            integration_account_id: account.id,
            seller_id: account.account_identifier,
            limit: pagination.itemsPerPage,
            offset: offset,
            filters: {
              periodoDias: filters.periodo === 'custom' ? 0 : parseInt(filters.periodo),
              claim_type: filters.type || '',
              stage: filters.stage || '',
              fulfilled: undefined,
              quantity_type: '',
              reason_id: '',
              resource: ''
            }
          }
        });

        if (functionError) {
          console.error('[useReclamacoes] Erro na edge function para conta', account.id, functionError);
          continue; // Pular esta conta e continuar com as outras
        }

        // ✅ CORREÇÃO: A resposta do ml-api-direct vem em data.data, não data.claims
        if (data?.success && data?.data) {
          allClaims.push(...data.data);
        }
      }

      // Consolidar dados de todas as contas
      const { data, error: functionError } = { 
        data: { claims: allClaims }, 
        error: allClaims.length === 0 ? new Error('Nenhum dado retornado') : null 
      };

      if (functionError) {
        console.error('[useReclamacoes] Erro na edge function:', functionError);
        // Se a API falhar, usar dados do cache se existir
        if (cached && cached.length > 0) {
          console.warn('[useReclamacoes] Usando dados do cache como fallback');
          setReclamacoes(cached);
          return;
        }
        throw functionError;
      }

      if (allClaims.length > 0) {
        // ✅ CORREÇÃO: Processar claims seguindo o padrão de /ml-orders-completas
        // As mensagens já vêm no campo claim_messages.messages
        const formattedClaims = allClaims.map((claim: any) => {
          const claimMessages = claim.claim_messages?.messages || [];
          
          return {
            claim_id: claim.claim_details?.id || claim.id,
            order_id: claim.order_details?.id || claim.resource_id || claim.order_id,
            tipo: claim.claim_details?.type || claim.type,
            subtipo: claim.claim_details?.subtype || claim.subtype,
            estagio: claim.claim_details?.stage || claim.stage,
            status: claim.claim_details?.status || claim.status,
            motivo_id: claim.claim_details?.reason_id || claim.reason_id,
            motivo_descricao: claim.reason?.description,
            tem_mensagens: claimMessages.length > 0,
            total_mensagens: claimMessages.length || 0,
            tem_evidencias: (claim.claim_details?.attachments_quantity || 0) > 0,
            total_evidencias: claim.claim_details?.attachments_quantity || 0,
            data_criacao: claim.claim_details?.date_created || claim.date_created,
            data_atualizacao: claim.claim_details?.last_updated || claim.last_updated,
            comprador_id: claim.order_details?.buyer?.id || claim.buyer_id,
            
            // ✅ CAMPO CRÍTICO: timeline_mensagens com as mensagens da API ML
            timeline_mensagens: claimMessages,
            
            // Campos adicionais
            resolution: claim.claim_details?.resolution || claim.resolution,
            site_id: claim.claim_details?.site_id || claim.site_id,
            mediations: claim.claim_details?.mediations || claim.mediations,
            integration_account_id: claim.integration_account_id
          };
        });

        // Aplicar filtros locais adicionais
        let filteredClaims = formattedClaims;

        if (filters.stage) {
          filteredClaims = filteredClaims.filter((c: any) => c.estagio === filters.stage);
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
      } else {
        setReclamacoes([]);
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
