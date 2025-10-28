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
  const [hasSearched, setHasSearched] = useState(false);
  const [allFilteredClaims, setAllFilteredClaims] = useState<any[]>([]);
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

      // Buscar seller_id e nome das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier, name')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        console.error('[useReclamacoes] Erro ao buscar dados das contas:', accountsError);
        throw new Error('Não foi possível obter informações das contas do Mercado Livre');
      }

      // Buscar da API ML para atualizar (buscar TODAS as claims de todas as contas - sem limit)
      const allClaims: any[] = [];
      
      console.log('[useReclamacoes] Buscando claims do período:', dataInicio, 'até', dataFim);
      
      for (const account of accountsData) {
        if (!account.account_identifier) {
          console.warn(`[useReclamacoes] Conta ${account.id} sem account_identifier (seller_id)`);
          continue;
        }

        console.log(`[useReclamacoes] Buscando claims da conta ${account.name || account.id}`);

        const { data, error: functionError } = await supabase.functions.invoke('ml-claims-fetch', {
          body: {
            accountId: account.id,
            sellerId: account.account_identifier,
            filters: {
              status: filters.status,
              type: filters.type,
              date_from: dataInicio,
              date_to: dataFim
            },
            limit: 1000, // Buscar muitos registros de uma vez
            offset: 0    // Sempre do início
          }
        });

        if (functionError) {
          console.error('[useReclamacoes] Erro na edge function para conta', account.id, functionError);
          continue; // Pular esta conta e continuar com as outras
        }

        if (data?.claims) {
          console.log(`[useReclamacoes] Conta ${account.name}: ${data.claims.length} claims encontradas`);
          // Adicionar o nome da empresa a cada claim
          const claimsWithEmpresa = data.claims.map((claim: any) => ({
            ...claim,
            empresa: account.name || account.account_identifier
          }));
          allClaims.push(...claimsWithEmpresa);
        }
      }

      console.log(`[useReclamacoes] Total de claims antes dos filtros locais: ${allClaims.length}`);

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

        console.log(`[useReclamacoes] Claims após filtros locais: ${filteredClaims.length}`);

        // Guardar todas as claims filtradas para paginação
        setAllFilteredClaims(filteredClaims);
        
        // Atualizar paginação com total correto
        const totalItems = filteredClaims.length;
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
        
        setPagination(prev => ({
          ...prev,
          totalItems,
          totalPages
        }));

        // Aplicar paginação local
        const startIdx = offset;
        const endIdx = offset + pagination.itemsPerPage;
        const paginatedClaims = filteredClaims.slice(startIdx, endIdx);

        console.log(`[useReclamacoes] Claims paginadas (${startIdx}-${endIdx}): ${paginatedClaims.length}`);

        // Buscar mensagens para cada claim do banco local
        const claimsWithMessages = await Promise.all(
          paginatedClaims.map(async (claim: any) => {
            const { data: mensagens } = await supabase
              .from('reclamacoes_mensagens')
              .select('*')
              .eq('claim_id', claim.claim_id)
              .order('date_created', { ascending: false });
            
            return {
              ...claim,
              timeline_mensagens: mensagens || []
            };
          })
        );

        setReclamacoes(claimsWithMessages);
        setHasSearched(true);
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

  // Buscar SOMENTE quando shouldFetch mudar (disparado pelo botão Buscar)
  useEffect(() => {
    if (shouldFetch && selectedAccountIds && selectedAccountIds.length > 0) {
      fetchReclamacoes();
    }
  }, [shouldFetch]);

  // Aplicar paginação local quando a página mudar (sem fazer nova busca na API)
  useEffect(() => {
    if (hasSearched && allFilteredClaims.length > 0) {
      const offset = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const startIdx = offset;
      const endIdx = offset + pagination.itemsPerPage;
      const paginatedClaims = allFilteredClaims.slice(startIdx, endIdx);

      console.log(`[useReclamacoes] Mudança de página - Claims paginadas (${startIdx}-${endIdx}): ${paginatedClaims.length}`);

      // Buscar mensagens para cada claim do banco local
      const loadMessages = async () => {
        const claimsWithMessages = await Promise.all(
          paginatedClaims.map(async (claim: any) => {
            const { data: mensagens } = await supabase
              .from('reclamacoes_mensagens')
              .select('*')
              .eq('claim_id', claim.claim_id)
              .order('date_created', { ascending: false });
            
            return {
              ...claim,
              timeline_mensagens: mensagens || []
            };
          })
        );
        setReclamacoes(claimsWithMessages);
      };

      loadMessages();
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
