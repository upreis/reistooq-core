/**
 * 🎣 HOOK PRINCIPAL DE RECLAMAÇÕES
 * FASE 4.4: Suporte para paginação
 */

import { useState, useEffect, useRef } from 'react';
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
  const [allFilteredClaims, setAllFilteredClaims] = useState<any[]>([]);
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
  
  // ✅ CONTROLE DE CANCELAMENTO
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReclamacoes = async (showLoading = true) => {
    // ✅ Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    if (!selectedAccountIds || selectedAccountIds.length === 0) {
      setReclamacoes([]);
      setAllFilteredClaims([]);
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

      // Buscar seller_id e nome das contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('integration_accounts')
        .select('id, account_identifier, name')
        .in('id', selectedAccountIds);

      if (accountsError || !accountsData || accountsData.length === 0) {
        console.error('[useReclamacoes] Erro ao buscar dados das contas:', accountsError);
        throw new Error('Não foi possível obter informações das contas do Mercado Livre');
      }

      // ✅ BUSCAR TODAS AS CLAIMS EM LOTE DE 100 (igual /ml-orders-completas)
      const allClaims: any[] = [];
      
      for (const account of accountsData) {
        if (!account.account_identifier) {
          console.warn(`[useReclamacoes] Conta ${account.id} sem account_identifier (seller_id)`);
          continue;
        }

        console.log(`🔍 Buscando claims de ${account.name} em lotes de 100...`);

        // ✅ LOOP PARA BUSCAR TODAS AS CLAIMS EM LOTE
        let offset = 0;
        const limit = 100;
        let hasMore = true;
        let tentativas = 0;
        const maxTentativas = 50; // Máximo 5000 claims (50 * 100)

        while (hasMore && tentativas < maxTentativas) {
          // ✅ Verificar se foi cancelado
          if (signal.aborted) {
            console.log('🛑 Busca cancelada pelo usuário');
            throw new Error('Busca cancelada');
          }
          
          tentativas++;
          
          try {
            console.log(`📦 Lote ${tentativas}: buscando claims ${offset}-${offset + limit} de ${account.name}...`);

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
                limit: limit,
                offset: offset
              }
            });

            if (functionError) {
              console.error('[useReclamacoes] Erro na edge function para conta', account.id, functionError);
              break; // Pular esta conta
            }

            if (!data?.claims || data.claims.length === 0) {
              console.log(`✅ Lote vazio - finalizando busca para ${account.name}`);
              break;
            }

            // Adicionar o nome da empresa a cada claim
            const claimsWithEmpresa = data.claims.map((claim: any) => ({
              ...claim,
              empresa: account.name || account.account_identifier
            }));
            
            allClaims.push(...claimsWithEmpresa);
            
            console.log(`✅ Lote ${tentativas}: ${claimsWithEmpresa.length} claims | Total acumulado: ${allClaims.length}`);

            // Verificar se há mais dados (usando paging da API ML)
            const paging = data.paging;
            if (paging) {
              const totalFromApi = paging.total || 0;
              hasMore = (offset + limit) < totalFromApi;
            } else {
              // Se não tem paging, verificar se recebeu menos que o limit
              hasMore = data.claims.length >= limit;
            }

            if (!hasMore) {
              console.log(`🏁 Não há mais dados para ${account.name}`);
              break;
            }

            offset += limit;

            // Delay para não sobrecarregar API ML
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.error(`❌ Erro no lote ${tentativas}:`, error);
            break;
          }
        }

        console.log(`🎉 Total de claims carregados para ${account.name}: ${allClaims.length}`);
      }

      console.log(`📊 TOTAL GERAL: ${allClaims.length} claims de todas as contas`);

      if (allClaims.length === 0) {
        toast({
          title: 'Nenhuma reclamação encontrada',
          description: 'Tente ajustar os filtros de busca.'
        });
        setReclamacoes([]);
        setAllFilteredClaims([]);
        setPagination(prev => ({
          ...prev,
          totalItems: 0,
          totalPages: 1,
          currentPage: 1
        }));
        return;
      }

      // Aplicar filtros locais adicionais
      let filteredClaims = allClaims;

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

      console.log(`🔍 Após filtros locais: ${filteredClaims.length} claims`);

      // ✅ ARMAZENAR TODAS AS CLAIMS FILTRADAS
      setAllFilteredClaims(filteredClaims);

      // ✅ ATUALIZAR PAGINAÇÃO COM TOTAL CORRETO
      setPagination(prev => ({
        ...prev,
        totalItems: filteredClaims.length,
        totalPages: Math.ceil(filteredClaims.length / prev.itemsPerPage),
        currentPage: 1 // Reset para página 1
      }));

      // ✅ APLICAR PAGINAÇÃO CLIENT-SIDE (SLICE LOCAL)
      const startIndex = 0;
      const endIndex = pagination.itemsPerPage;
      const paginatedClaims = filteredClaims.slice(startIndex, endIndex);

      // Buscar mensagens apenas para claims da página atual
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

      toast({
        title: `${filteredClaims.length} reclamações encontradas`,
        description: `Mostrando página 1 de ${Math.ceil(filteredClaims.length / pagination.itemsPerPage)}`
      });

    } catch (err: any) {
      if (err.message === 'Busca cancelada') {
        console.log('ℹ️ Busca cancelada pelo usuário');
        toast({
          title: 'Busca cancelada',
          description: 'A busca foi interrompida.'
        });
        setError(null);
        return;
      }
      
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
      abortControllerRef.current = null;
    }
  };

  // Buscar SOMENTE quando shouldFetch mudar (disparado pelo botão Buscar)
  useEffect(() => {
    if (shouldFetch && selectedAccountIds && selectedAccountIds.length > 0) {
      fetchReclamacoes();
    }
  }, [shouldFetch]);

  // ✅ PAGINAÇÃO CLIENT-SIDE - Aplicar slice local quando página mudar
  useEffect(() => {
    if (allFilteredClaims.length > 0) {
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      const paginatedClaims = allFilteredClaims.slice(startIndex, endIndex);

      // Buscar mensagens apenas para claims da página atual
      const fetchMessagesForPage = async () => {
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

      fetchMessagesForPage();
    }
  }, [pagination.currentPage, pagination.itemsPerPage, allFilteredClaims]);

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

  const cancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    reclamacoes,
    allClaims: allFilteredClaims, // ✅ EXPOR TODOS OS DADOS FILTRADOS
    isLoading,
    isRefreshing,
    error,
    pagination,
    goToPage,
    changeItemsPerPage,
    refresh: () => fetchReclamacoes(false),
    cancelFetch
  };
}
