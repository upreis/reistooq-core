/**
 * 🚀 HOOK DE BUSCA INCREMENTAL DE RECLAMAÇÕES
 * Busca apenas atualizações e novos registros
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withRetry } from '@/utils/apiRetry';

interface IncrementalFetchOptions {
  selectedAccountIds: string[];
  filters: {
    status?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  };
}

export function useReclamacoesIncremental() {
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<string | null>(null);
  const [isLoadingIncremental, setIsLoadingIncremental] = useState(false);
  const { toast } = useToast();
  
  // ✅ CORREÇÃO: Sincronizar processedClaimIds com dadosInMemory do localStorage
  const getInitialClaimIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('reclamacoes-data');
      if (stored) {
        const data = JSON.parse(stored);
        return new Set(Object.keys(data));
      }
    } catch (error) {
      console.error('Erro ao carregar claim IDs:', error);
    }
    return new Set();
  };
  
  const processedClaimIds = useRef<Set<string>>(getInitialClaimIds());

  /**
   * Busca apenas claims novos ou atualizados desde o último fetch
   */
  const fetchIncremental = useCallback(async (options: IncrementalFetchOptions) => {
    const { selectedAccountIds, filters } = options;
    
    if (!selectedAccountIds || selectedAccountIds.length === 0) {
      return { newClaims: [], updatedClaims: [] };
    }

    try {
      setIsLoadingIncremental(true);

      // ✅ Buscar dados das contas COM RETRY
      const accountsResult = await withRetry(
        async () => {
          return await supabase
            .from('integration_accounts')
            .select('id, account_identifier, name')
            .in('id', selectedAccountIds);
        },
        { maxRetries: 3 }
      );
      
      const { data: accountsData, error: accountsError } = accountsResult as any;

      if (accountsError || !accountsData || accountsData.length === 0) {
        throw new Error('Não foi possível obter informações das contas');
      }

      const newClaims: any[] = [];
      const updatedClaims: any[] = [];

      for (const account of accountsData) {
        if (!account.account_identifier) continue;

        // ✅ Edge function COM RETRY para evitar falhas de rede
        const functionResult = await withRetry(
          async () => {
            return await supabase.functions.invoke('ml-claims-fetch', {
              body: {
                accountId: account.id,
                sellerId: account.account_identifier,
                filters: {
                  status: filters.status,
                  type: filters.type,
                  date_from: filters.date_from,
                  date_to: filters.date_to
                },
                limit: 50,
                offset: 0
              }
            });
          },
          { maxRetries: 3, retryDelay: 1000 }
        );
        
        const { data, error: functionError } = functionResult as any;

        if (functionError) {
          console.error('[Incremental] Erro na edge function:', functionError);
          continue;
        }

        if (!data?.claims || data.claims.length === 0) {
          continue;
        }

        // ✅ FILTRAR apenas claims atualizados desde lastFetchTimestamp
        let relevantClaims = data.claims;
        if (lastFetchTimestamp) {
          const lastFetchTime = new Date(lastFetchTimestamp).getTime();
          relevantClaims = data.claims.filter((claim: any) => {
            const claimUpdateTime = new Date(claim.last_updated || claim.date_created).getTime();
            return claimUpdateTime > lastFetchTime;
          });
        }

        // Classificar claims em novos ou atualizados
        const claimsWithEmpresa = relevantClaims.map((claim: any) => ({
          ...claim,
          empresa: account.name || account.account_identifier
        }));

        for (const claim of claimsWithEmpresa) {
          const claimId = claim.claim_id || claim.id;
          
          if (processedClaimIds.current.has(claimId)) {
            // Claim já existe -> é uma atualização
            updatedClaims.push(claim);
          } else {
            // Claim novo
            newClaims.push(claim);
            processedClaimIds.current.add(claimId);
          }
        }
      }

      // Atualizar timestamp do último fetch
      setLastFetchTimestamp(new Date().toISOString());

      if (newClaims.length > 0 || updatedClaims.length > 0) {
        toast({
          title: 'Atualizações encontradas',
          description: `${newClaims.length} novos, ${updatedClaims.length} atualizados`
        });
      }

      return { newClaims, updatedClaims };

    } catch (err: any) {
      console.error('[Incremental] Erro:', err);
      toast({
        variant: 'destructive',
        title: 'Erro na busca incremental',
        description: err.message
      });
      return { newClaims: [], updatedClaims: [] };
    } finally {
      setIsLoadingIncremental(false);
    }
  }, [lastFetchTimestamp, toast]);

  /**
   * Reset para forçar busca completa novamente
   */
  const resetIncremental = useCallback(() => {
    setLastFetchTimestamp(null);
    processedClaimIds.current.clear();
  }, []);

  return {
    fetchIncremental,
    resetIncremental,
    isLoadingIncremental,
    lastFetchTimestamp
  };
}
